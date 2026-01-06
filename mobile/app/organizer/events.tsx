import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { authFetch } from '../../api/authFetch';

type Event = {
  id: number;
  title: string;
  eventDate?: string;
  startTime?: string;
};

export default function OrganizerEvents() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMyEvents = async () => {
    try {
      const res = await authFetch('/api/events/my-events', { method: 'GET' });
      if (res.ok) {
        const txt = await res.text();
        const json = JSON.parse(txt);
        setEvents(json.data || json || []);
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchMyEvents();
      setLoading(false);
    })();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyEvents();
    setRefreshing(false);
  };

  const openScanner = (eventId: number) => {
    console.log("Scanner açılıyor, ID:", eventId);
    
    // YANLIŞ OLAN (Seni detay sayfasına geri atar):
    // router.push(`/organizer/event/${eventId}`); 

    // DOĞRU OLAN (Seni tarama sayfasına ID ile gönderir):
    router.push(`/organizer/scan?eventId=${eventId}`);
};
  const renderItem = ({ item }: { item: Event }) => (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.meta}>{item.eventDate} {item.startTime}</Text>
      </View>
      <TouchableOpacity style={styles.btn} onPress={() => openScanner(item.id)}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>QR Tara</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <View style={{ padding: 16, backgroundColor: '#fff' }}>
        <Text style={{ fontSize: 20, fontWeight: '800' }}>Etkinliklerim</Text>
        {loading && <ActivityIndicator />}
      </View>

      <FlatList
        contentContainerStyle={{ padding: 16 }}
        data={events}
        keyExtractor={(e, i) => String(e?.id ?? i)}
        renderItem={renderItem}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 24, color: '#94a3b8' }}>Etkinlik bulunamadı.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  meta: { color: '#64748b', marginTop: 6 },
  btn: { backgroundColor: '#4f46e5', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 }
});
