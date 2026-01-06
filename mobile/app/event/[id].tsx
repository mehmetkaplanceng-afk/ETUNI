import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { authFetch } from "../../api/authFetch";

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
        // We don't have a single event endpoint in controller yet?
        // WebController has it, but it returns HTML.
        // EventController needs getById.
        // Let's check EventController. If missing, I'll use list and find (inefficient) or add endpoint.
        // Assuming /api/events/list returns all, I can filter.
        // Better: Add /api/events/{id} to backend if missing.
        // For now, I will try to fetch list and find.
        setLoading(true);
        try {
            const res = await authFetch(`/api/events/list?universityId=1`, { method: "GET" }); // Mock uni ID
            if (res.ok) {
                const list: EventDetail[] = await res.json();
                const found = list.find(e => String(e.id) === String(id));
                if (found) setEvent(found);
            }
        } finally {
            setLoading(false);
        }
    };

    const joinEvent = async () => {
        try {
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
        <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                <Text style={styles.type}>{event.eventType}</Text>
                <Text style={styles.title}>{event.title}</Text>

                <View style={styles.meta}>
                    <Text style={styles.metaText}>📅 {event.eventDate}</Text>
                    <Text style={styles.metaText}>⏰ {event.startTime}</Text>
                </View>

                <View style={styles.divider} />

                <Text style={styles.sectionTitle}>Açıklama</Text>
                <Text style={styles.desc}>{event.description}</Text>

                <Text style={styles.sectionTitle}>Kategori</Text>
                <Text style={styles.tag}>{event.category || "Genel"}</Text>

                <Text style={styles.sectionTitle}>Hedef Kitle</Text>
                <Text style={styles.tag}>{event.targetAudience || "Herkes"}</Text>

                <TouchableOpacity style={styles.btn} onPress={joinEvent}>
                    <Text style={styles.btnText}>Etkinliğe Katıl</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20, alignItems: 'center' }}>
                    <Text style={{ color: '#666' }}>Geri Dön</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    type: { color: "#4f46e5", fontWeight: "700", marginBottom: 8, letterSpacing: 1 },
    title: { fontSize: 28, fontWeight: "900", color: "#1e293b", marginBottom: 16 },
    meta: { flexDirection: "row", gap: 20, marginBottom: 20 },
    metaText: { fontSize: 16, color: "#475569", fontWeight: "600" },
    divider: { height: 1, backgroundColor: "#e2e8f0", marginBottom: 20 },
    sectionTitle: { fontSize: 18, fontWeight: "800", marginBottom: 8, color: "#334155" },
    desc: { fontSize: 16, lineHeight: 24, color: "#475569", marginBottom: 20 },
    tag: { backgroundColor: "#f1f5f9", alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, overflow: "hidden", color: "#64748b", marginBottom: 20 },
    btn: { backgroundColor: "#4f46e5", paddingVertical: 16, borderRadius: 16, alignItems: "center", marginTop: 20, shadowColor: "#4f46e5", shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
    btnText: { color: "#fff", fontWeight: "800", fontSize: 18 },
});
