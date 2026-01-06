import React, { useState, useCallback } from 'react';
import { SafeAreaView, View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router'; // useFocusEffect eklendi
import { authFetch } from '../../../api/authFetch';
import { Ionicons } from '@expo/vector-icons';

export default function OrganizerEventDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false); // Manuel yenileme için
  const [attendees, setAttendees] = useState<any[]>([]);
  const [count, setCount] = useState<number>(0);

  // useFocusEffect: Sayfaya her geri dönüldüğünde çalışır
  useFocusEffect(
    useCallback(() => {
      if (id) {
        fetchAttendees();
      }
    }, [id])
  );

  const fetchAttendees = async () => {
    // Eğer zaten yenileme yapıyorsak loading'i açma (titreme yapmasın)
    if (!refreshing) setLoading(true);
    
    try {
      // Backend endpointinin doğru olduğundan emin ol. Genelde "/api/events/{id}/attendees" olur.
      const res = await authFetch(`/api/events/${id}/attendees`, { method: 'GET' });
      
      if (res.ok) {
        const txt = await res.text();
        const json = JSON.parse(txt);
        const data = json.data || json;
        
        // Backend'den gelen veri yapısına göre burayı eşleştiriyoruz
        // Genelde backend "data" içinde bir liste ve count döner
        // Eğer backend direkt liste dönüyorsa: data.length kullan
        
        const list = Array.isArray(data) ? data : (data.attendees || []);
        const totalCount = typeof data.count === 'number' ? data.count : list.length;

        setCount(totalCount);
        setAttendees(list);
      } else {
        console.log("Veri çekilemedi:", res.status);
      }
    } catch (error) {
      console.error("Liste hatası:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Elle aşağı çekince çalışacak fonksiyon
  const onRefresh = () => {
    setRefreshing(true);
    fetchAttendees();
  };

  const openScanner = () => {
    router.push(`/organizer/scan?eventId=${id}`);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      
      {/* Üst Başlık */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 5 }}>
             <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '800', flex: 1, textAlign: 'center', marginLeft: -30 }}>Etkinlik Detayı</Text>
      </View>

      {/* Aksiyon Alanı */}
      <View style={{ padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
            <Text style={{ fontSize: 14, color: '#64748b' }}>Toplam Giriş</Text>
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#0f172a' }}>{count}</Text>
        </View>
        
        <TouchableOpacity style={styles.scanBtn} onPress={openScanner}>
          <Ionicons name="qr-code-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={{ color: '#fff', fontWeight: '700' }}>QR Tara</Text>
        </TouchableOpacity>
      </View>

      {/* Liste */}
      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={attendees}
          keyExtractor={(t, i) => t.id ? String(t.id) : String(i)}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4f46e5']} />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.avatar}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                    {item.userName ? item.userName.charAt(0).toUpperCase() : '?'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', fontSize: 16, color: '#1e293b' }}>
                    {item.userName || item.userFullName || 'İsimsiz Kullanıcı'}
                </Text>
                <Text style={{ color: '#64748b', fontSize: 13 }}>
                    {item.userEmail || '-'}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: '#059669', fontWeight: '600', fontSize: 12, marginBottom: 4 }}>
                    Onaylandı
                </Text>
                <Text style={{ color: '#94a3b8', fontSize: 11 }}>
                    {item.scannedAt ? new Date(item.scannedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                </Text>
              </View>
            </View>
          )}
          contentContainerStyle={{ padding: 16, paddingBottom: 50 }}
          ListEmptyComponent={
            <View style={{ marginTop: 50, alignItems: 'center' }}>
                <Text style={{ color: '#94a3b8' }}>Henüz giriş yapan kimse yok.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 16,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  scanBtn: {
    backgroundColor: '#4f46e5',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5
  },
  card: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 16, 
    marginBottom: 12, 
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  }
});