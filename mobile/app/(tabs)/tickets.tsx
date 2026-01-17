import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    View,
    Image,
    TouchableOpacity,
    Clipboard,
    Alert,
    Modal,
    Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { authFetch, API_URL } from "../../api/authFetch";

type Ticket = {
    eventId: number;
    eventTitle: string;
    eventType: string;
    scannedAt: string;
    verified: boolean;
    status: string;
    attendanceId?: number;
    ticketCode?: string;
};

type HistoryResponse = {
    totalAttendance: number;
    history: Ticket[];
};

export default function TicketsScreen() {
    const [loading, setLoading] = useState(false);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [previewUri, setPreviewUri] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchTickets = async () => {
        const res = await authFetch("/api/profile/attendance-history", { method: "GET" });
        if (res.ok) {
            const txt = await res.text();
            const json = JSON.parse(txt);
            // Backend returns ApiResponse { data: { items: [...] } }
            const data = json.data || json;
            setTickets(data.items || data.history || []);
        }
    };

    useEffect(() => {
        (async () => {
            setLoading(true);
            await fetchTickets();
            setLoading(false);
        })();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchTickets();
        setRefreshing(false);
    }

    const renderTicket = ({ item }: { item: Ticket }) => {
        return (
            <View style={styles.card}>
                <View style={styles.left}>
                    <Text style={styles.title}>{item.eventTitle}</Text>
                    <Text style={styles.type}>{item.eventType}</Text>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                        <Text style={[styles.status, item.verified ? styles.verified : styles.pending]}>
                            {item.verified ? "✅ Katılım Onaylandı" : "🎟️ Bilet Hazır"}
                        </Text>
                        {!item.verified && (
                            <Text style={[styles.status,
                            item.status === 'APPROVED' ? styles.verified :
                                item.status === 'REJECTED' ? styles.rejected :
                                    styles.pending
                            ]}>
                                {item.status === 'APPROVED' ? "Onaylandı" :
                                    item.status === 'REJECTED' ? "Reddedildi" :
                                        "Onay Bekliyor"}
                            </Text>
                        )}
                    </View>
                    {item.ticketCode && item.attendanceId && (
                        <View style={{ marginTop: 12 }}>
                            <TouchableOpacity onPress={() => {
                                // copy code
                                try {
                                    Clipboard.setString(item.ticketCode || "");
                                    Alert.alert("Kopyalandı", "Bilet kodu panoya kopyalandı.");
                                } catch (e) {
                                    // ignore
                                }
                            }}>
                                <Text style={{ color: '#333', fontWeight: '700' }}>Kod: {item.ticketCode}</Text>
                            </TouchableOpacity>

                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                                <TouchableOpacity onPress={() => setPreviewUri(`${API_URL}/api/attendance/${item.attendanceId}/qr`)}>
                                    <Image
                                        source={{ uri: `${API_URL}/api/attendance/${item.attendanceId}/qr` }}
                                        style={{ width: 140, height: 140 }}
                                    />
                                </TouchableOpacity>
                                <TouchableOpacity style={{ marginLeft: 12 }} onPress={() => Linking.openURL(`${API_URL}/api/attendance/${item.attendanceId}/qr`)}>
                                    <Text style={{ color: '#4f46e5', fontWeight: '700' }}>Aç/Kaydet</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Biletlerim</Text>
                {loading && <ActivityIndicator />}
            </View>

            <FlatList
                data={tickets}
                keyExtractor={(t) => String(t.eventId)}
                refreshing={refreshing}
                onRefresh={onRefresh}
                renderItem={renderTicket}
                contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
                ListEmptyComponent={<Text style={styles.empty}>Henüz biletiniz yok.</Text>}
            />
            <Modal visible={!!previewUri} transparent animationType="fade" onRequestClose={() => setPreviewUri(null)}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' }}>
                    <TouchableOpacity style={{ position: 'absolute', top: 40, right: 20 }} onPress={() => setPreviewUri(null)}>
                        <Text style={{ color: '#fff', fontWeight: '700' }}>Kapat</Text>
                    </TouchableOpacity>
                    {previewUri && (
                        <Image source={{ uri: previewUri }} style={{ width: 320, height: 320 }} />
                    )}
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: { padding: 16, backgroundColor: "#fff" },
    headerTitle: { fontSize: 24, fontWeight: "800", color: "#1e293b" },
    card: { flexDirection: "row", backgroundColor: "#fff", padding: 20, borderRadius: 16, marginBottom: 16, alignItems: "center", justifyContent: "space-between", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    left: { flex: 1 },
    title: { fontSize: 18, fontWeight: "700", color: "#1e293b", marginBottom: 4 },
    type: { fontSize: 14, color: "#64748b", marginBottom: 12 },
    status: { fontSize: 13, fontWeight: "700", paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, alignSelf: "flex-start", overflow: "hidden" },
    verified: { backgroundColor: "#dcfce7", color: "#166534" },
    pending: { backgroundColor: "#fef9c3", color: "#854d0e" },
    rejected: { backgroundColor: "#fee2e2", color: "#991b1b" },
    empty: { textAlign: "center", color: "#94a3b8", marginTop: 20 },
});
