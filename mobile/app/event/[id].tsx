import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { WebView } from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";
import { authFetch } from "../../api/authFetch";
import { Ionicons } from "@expo/vector-icons";

type EventDetail = {
    id: number;
    title: string;
    description: string;
    eventType: string;
    eventDate: string;
    startTime: string;
    category?: string;
    targetAudience?: string;
    universityId?: number;
    location?: string;
    latitude?: number;
    longitude?: number;
    price?: number;
    status: 'ACTIVE' | 'PASSIVE';
};

export default function EventDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [event, setEvent] = useState<EventDetail | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (id) {
            fetchDetails();
        }
    }, [id]);

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const res = await authFetch(`/api/events/${id}`, { method: "GET" });
            if (res.ok) {
                const json = await res.json();
                // Unwrap ApiResponse { data: EventDetail, ... }
                if (json && json.data) {
                    setEvent(json.data);
                }
            } else {
                console.error("Event fetch failed:", res.status);
            }
        } catch (e) {
            console.error("Event fetch error:", e);
        } finally {
            setLoading(false);
        }
    };

    const joinEvent = async () => {
        if (!event || event.status === 'PASSIVE') {
            alert("Bu etkinlik sona erdiği için katılamazsınız.");
            return;
        }

        try {
            // Check if event is paid
            if (event && event.price && event.price > 0) {
                // Navigate to payment screen
                router.push(`/payment?eventId=${id}&price=${event.price}&title=${encodeURIComponent(event.title)}`);
                return;
            }

            // Free event - join directly
            setLoading(true);
            const res = await authFetch(`/api/attendance/join/${id}`, { method: "POST" });
            if (res.ok) {
                alert("Etkinliğe katıldınız!");
                router.push("/(tabs)/tickets");
            } else {
                alert("Katılım başarısız.");
            }
        } catch (e) {
            alert("Hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <SafeAreaView><ActivityIndicator style={{ marginTop: 50 }} /></SafeAreaView>;
    if (!event) return <SafeAreaView><Text style={{ padding: 20 }}>Etkinlik bulunamadı.</Text></SafeAreaView>;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Etkinlik Detayı</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }}>
                <Text style={styles.type}>{event.eventType}</Text>
                <Text style={styles.title}>{event.title}</Text>

                <View style={styles.meta}>
                    <Text style={styles.metaText}>📅 {event.eventDate}</Text>
                    <Text style={styles.metaText}>⏰ {event.startTime}</Text>
                    {event.price !== undefined && event.price !== null && (
                        event.price > 0 ? (
                            <View style={styles.priceBadgePaid}>
                                <Text style={styles.priceBadgeTextPaid}>₺{event.price.toFixed(2)}</Text>
                            </View>
                        ) : (
                            <View style={styles.priceBadgeFree}>
                                <Text style={styles.priceBadgeTextFree}>ÜCRETSİZ</Text>
                            </View>
                        )
                    )}
                </View>

                <View style={styles.divider} />

                <Text style={styles.sectionTitle}>Açıklama</Text>
                <Text style={styles.desc}>{event.description}</Text>

                <Text style={styles.sectionTitle}>Kategori</Text>
                <Text style={styles.tag}>{event.category || "Genel"}</Text>

                <Text style={styles.sectionTitle}>Hedef Kitle</Text>
                <Text style={styles.tag}>{event.targetAudience || "Herkes"}</Text>

                {event.location && (
                    <>
                        <Text style={styles.sectionTitle}>Konum</Text>
                        <Text style={styles.metaText}>📍 {event.location}</Text>
                    </>
                )}

                {event.latitude && event.longitude && (
                    <View style={styles.mapContainer}>
                        <WebView
                            originWhitelist={['*']}
                            source={{
                                html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
                <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
                <style>
                  body { margin: 0; padding: 0; }
                  #map { height: 100vh; width: 100vw; }
                </style>
              </head>
              <body>
                <div id="map"></div>
                <script>
                  var map = L.map('map', {
                    zoomControl: false,
                    attributionControl: false
                  }).setView([${event.latitude}, ${event.longitude}], 15);
                  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
                  L.marker([${event.latitude}, ${event.longitude}]).addTo(map);
                </script>
              </body>
              </html>
            `}}
                            style={{ flex: 1 }}
                        />
                    </View>
                )}

                <TouchableOpacity
                    style={[styles.btn, event.status === 'PASSIVE' && styles.btnDisabled]}
                    onPress={joinEvent}
                    disabled={event.status === 'PASSIVE'}
                >
                    <Text style={styles.btnText}>
                        {event.status === 'PASSIVE' ? "Etkinlik Sona Erdi" : "Etkinliğe Katıl"}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1e293b',
    },
    type: { color: "#4f46e5", fontWeight: "700", marginBottom: 8, letterSpacing: 1 },
    title: { fontSize: 28, fontWeight: "900", color: "#1e293b", marginBottom: 16 },
    meta: { flexDirection: "row", gap: 20, marginBottom: 20 },
    metaText: { fontSize: 16, color: "#475569", fontWeight: "600" },
    divider: { height: 1, backgroundColor: "#e2e8f0", marginBottom: 20 },
    sectionTitle: { fontSize: 18, fontWeight: "800", marginBottom: 8, color: "#334155" },
    desc: { fontSize: 16, lineHeight: 24, color: "#475569", marginBottom: 20 },
    tag: { backgroundColor: "#f1f5f9", alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, overflow: "hidden", color: "#64748b", marginBottom: 20 },
    mapContainer: {
        height: 200,
        borderRadius: 16,
        overflow: 'hidden',
        marginVertical: 15,
        borderWidth: 1,
        borderColor: '#e2e8f0'
    },
    btn: { backgroundColor: "#4f46e5", paddingVertical: 16, borderRadius: 16, alignItems: "center", marginTop: 20, shadowColor: "#4f46e5", shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
    btnDisabled: { backgroundColor: "#cbd5e1", shadowOpacity: 0 },
    btnText: { color: "#fff", fontWeight: "800", fontSize: 18 },
    priceBadgePaid: {
        backgroundColor: '#a855f7',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    priceBadgeTextPaid: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 13,
    },
    priceBadgeFree: {
        backgroundColor: '#10b981',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    priceBadgeTextFree: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 13,
    },
});
