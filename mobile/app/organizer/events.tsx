import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { authFetch } from '../../api/authFetch';

type Event = {
  id: number;
  title: string;
  eventDate?: string;
  startTime?: string;
  price?: number;
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


  const renderItem = ({ item }: { item: Event }) => (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{item.title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
          <Text style={styles.meta}>{item.eventDate} {item.startTime}</Text>
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
      </View>
      <TouchableOpacity style={styles.btn} onPress={() => router.push(`/organizer/event/${item.id}`)}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>Detay</Text>
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

      {/* Floating Create Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/organizer/create-event')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  meta: { color: '#64748b', marginTop: 6 },
  btn: { backgroundColor: '#4f46e5', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 90 : 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5
  },
  fabText: { fontSize: 32, color: '#fff', fontWeight: '300', marginTop: -2 },
  priceBadgePaid: {
    backgroundColor: '#a855f7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priceBadgeTextPaid: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 10,
  },
  priceBadgeFree: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priceBadgeTextFree: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 10,
  },
});
