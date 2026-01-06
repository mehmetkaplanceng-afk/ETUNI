import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  RefreshControl
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import { authFetch } from "../../api/authFetch";
import { debug } from "../../utils/logger";
import { Ionicons } from '@expo/vector-icons';

type EventApi = {
  id: number;
  title: string;
  description: string;
  eventType: string;
  eventDate: string;
  startTime: string;
  category?: string;
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
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{item.eventType}</Text>
      </View>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardSub}>{item.eventDate} - {item.startTime}</Text>
      <Text numberOfLines={2} style={styles.desc}>{item.description}</Text>

      <TouchableOpacity
        style={styles.btn}
        onPress={() => joinEvent(item.id)}
      >
        <Text style={styles.btnText}>Katıl</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderRecommended = ({ item }: { item: RecommendedEvent }) => (
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
  desc: { color: "#475569", marginBottom: 16, lineHeight: 20 },
  
  badge: { alignSelf: "flex-start", backgroundColor: "#e0e7ff", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 10 },
  badgeText: { color: "#4338ca", fontWeight: "700", fontSize: 12 },
  
  btn: { backgroundColor: "#4f46e5", paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "700" },
  
  empty: { textAlign: "center", color: "#94a3b8", fontSize: 16 },
});