import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  RefreshControl,
  Linking
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import { authFetch, API_URL } from "../../api/authFetch";
import { debug } from "../../utils/logger";
import { Ionicons } from '@expo/vector-icons';

type EventApi = {
  id: number;
  title: string;
  description: string;
  eventType: string;
  eventDate: string;
  startTime: string;
  clubId?: number;
  clubName?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  category?: string;
  price?: number;
};

type RecommendedEvent = {
  event: EventApi;
  totalScore: number;
  explanation: string;
};

export default function EventsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Data State
  const [events, setEvents] = useState<EventApi[]>([]);
  const [recommended, setRecommended] = useState<RecommendedEvent[]>([]);

  // Search State
  const [searchText, setSearchText] = useState("");

  const fetchEvents = async () => {
    const uniId = await AsyncStorage.getItem("universityId") || "1";

    // 1. Fetch main events
    debug("Fetching events for university:", uniId);
    const res = await authFetch(`/api/events/university/${uniId}`, { method: "GET" });
    if (res.ok) {
      const json = JSON.parse(await res.text());
      setEvents(json.data || []);
    } else {
      debug("Failed to fetch events:", res.status);
    }

    // 2. Fetch recommendations
    const recRes = await authFetch("/api/events/recommended", { method: "GET" });
    if (recRes.ok) {
      const json = JSON.parse(await recRes.text());
      if (json.data) {
        setRecommended(json.data);
      }
    }
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await fetchEvents();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  };

  const joinEvent = async (eventId: number) => {
    // Find event to check if it's paid
    const event = events.find(e => e.id === eventId);

    // If event has price > 0, redirect to payment (web view for now)
    if (event && event.price && event.price > 0) {
      Alert.alert(
        'Ücretli Etkinlik',
        `Bu etkinliğin ücreti ₺${event.price.toFixed(2)}. Ödeme sayfasına yönlendirileceksiniz.`,
        [
          { text: 'İptal', style: 'cancel' },
          {
            text: 'Devam Et',
            onPress: () => {
              // Navigate to native payment screen
              router.push(`/payment?eventId=${event.id}&price=${event.price}&title=${encodeURIComponent(event.title)}`);
            }
          }
        ]
      );
      return;
    }

    // Free event - join directly
    try {
      setLoading(true);
      const res = await authFetch(`/api/attendance/join/${eventId}`, { method: "POST" });
      if (res.ok) {
        Alert.alert("Başarılı", "Etkinliğe katıldınız! Biletlerim sekmesinden karekodunuzu görebilirsiniz.");
      } else {
        const txt = await res.text();
        const json = JSON.parse(txt);
        Alert.alert("Uyarı", json.message || "Katılım başarısız.");
      }
    } catch (e) {
      Alert.alert("Hata", "Bir sorun oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const goToDetail = (eventId: number) => {
    router.push(`/event/${eventId}`);
  };

  // --- Search Logic ---
  const filteredEvents = events.filter(e =>
    e.title.toLowerCase().includes(searchText.toLowerCase()) ||
    e.description.toLowerCase().includes(searchText.toLowerCase())
  );

  // --- Renderers ---

  const renderEvent = ({ item }: { item: EventApi }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => goToDetail(item.id)}
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.eventType}</Text>
        </View>
        {item.clubName && (
          <View style={{ ...styles.badge, backgroundColor: '#e0e7ff' }}>
            <Text style={{ ...styles.badgeText, color: '#4338ca' }}>
              🏛️ {item.clubName}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 }}>
        <Text style={styles.cardSub}>{item.eventDate} - {item.startTime}</Text>
        {item.price !== undefined && item.price !== null && (
          item.price > 0 ? (
            <View style={styles.priceBadgePaid}>
              <Text style={styles.priceBadgeTextPaid}>₺{item.price.toFixed(2)}</Text>
            </View>
          ) : (
            <View style={styles.priceBadgeFree}>
              <Text style={styles.priceBadgeTextFree}>ÜCRETSİZ</Text>
            </View>
          )
        )}
      </View>
      {item.location && <Text style={styles.locationText}>📍 {item.location}</Text>}
      <Text numberOfLines={2} style={styles.desc}>{item.description}</Text>

      <TouchableOpacity
        style={styles.btn}
        onPress={() => joinEvent(item.id)}
      >
        <Text style={styles.btnText}>Katıl</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderRecommended = ({ item }: { item: RecommendedEvent }) => {
    // Guard against undefined/null item or item.event
    if (!item || !item.event) {
      return null;
    }

    return (
      <TouchableOpacity
        style={[styles.card, styles.recommendedCard]}
        onPress={() => goToDetail(item.event.id)}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.event.eventType}</Text>
          </View>
          <Text style={{ color: '#4f46e5', fontWeight: 'bold', fontSize: 12 }}>
            %{Math.round(item.totalScore * 100)} Eşleşme
          </Text>
        </View>
        <Text style={styles.cardTitle}>{item.event.title}</Text>
        <Text style={styles.cardSub}>{item.event.eventDate}</Text>
        <Text numberOfLines={2} style={styles.desc}>{item.explanation}</Text>

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: '#e0e7ff' }]}
          onPress={() => goToDetail(item.event.id)}
        >
          <Text style={[styles.btnText, { color: '#4338ca' }]}>İncele</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <View style={styles.header}>
        <Text style={styles.title}>Keşfet</Text>
        {loading && <ActivityIndicator color="#4f46e5" />}
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#94a3b8" style={{ marginRight: 8 }} />
        <TextInput
          placeholder="Etkinlik ara..."
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor="#94a3b8"
        />
      </View>

      <FlatList
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        data={filteredEvents}
        keyExtractor={(e, idx) => String(e?.id ?? idx)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}

        ListHeaderComponent={
          recommended.length > 0 && searchText === "" ? (
            <View style={{ marginBottom: 24 }}>
              <Text style={styles.sectionTitle}>✨ Sizin İçin Önerilenler</Text>
              <FlatList
                horizontal
                data={recommended}
                // --- DÜZELTİLEN KISIM BURASI ---
                renderItem={({ item }) => renderRecommended({ item })}
                keyExtractor={(item, idx) => String(item?.event?.id ?? idx)}
                showsHorizontalScrollIndicator={false}
              />
            </View>
          ) : null
        }

        renderItem={({ item }) => renderEvent({ item })}
        ListEmptyComponent={
          <View style={{ marginTop: 40, alignItems: 'center' }}>
            <Text style={styles.empty}>
              {searchText ? "Aramanızla eşleşen etkinlik bulunamadı." : "Henüz etkinlik yok."}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff" },
  title: { fontSize: 28, fontWeight: "800", color: "#1e293b" },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12, color: '#1e293b', marginLeft: 4 },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  searchInput: { flex: 1, fontSize: 16, color: '#334155' },

  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  recommendedCard: { width: 300, marginRight: 16, borderWidth: 1, borderColor: '#e0e7ff' },

  cardTitle: { fontSize: 18, fontWeight: "700", marginBottom: 4, color: "#1e293b" },
  cardSub: { color: "#64748b", marginBottom: 8, fontSize: 13, fontWeight: '500' },
  locationText: { color: "#4f46e5", fontSize: 13, fontWeight: "600", marginBottom: 8 },
  desc: { color: "#475569", marginBottom: 16, lineHeight: 20 },

  badge: { alignSelf: "flex-start", backgroundColor: "#e0e7ff", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 10 },
  badgeText: { color: "#4338ca", fontWeight: "700", fontSize: 12 },

  btn: { backgroundColor: "#4f46e5", paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "700" },

  priceBadgePaid: {
    backgroundColor: '#a855f7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  priceBadgeTextPaid: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 11,
  },
  priceBadgeFree: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  priceBadgeTextFree: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 11,
  },

  empty: { textAlign: "center", color: "#94a3b8", fontSize: 16 },
});