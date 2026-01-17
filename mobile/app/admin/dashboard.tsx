import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Modal,
    Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DashboardStats, getDashboardStats, broadcastNotification } from "../../api/adminApi";
import { debug } from "../../utils/logger";

export default function AdminDashboardScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    // Broadcast Modal States
    const [modalVisible, setModalVisible] = useState(false);
    const [notifTitle, setNotifTitle] = useState("");
    const [notifMessage, setNotifMessage] = useState("");
    const [sending, setSending] = useState(false);

    const loadStats = async () => {
        try {
            setLoading(true);
            const data = await getDashboardStats();
            setStats(data);
        } catch (e) {
            debug("Failed to load admin stats", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStats();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadStats();
        setRefreshing(false);
    };

    const handleBroadcast = async () => {
        if (!notifTitle.trim() || !notifMessage.trim()) {
            Alert.alert("Hata", "Lütfen başlık ve mesaj alanlarını doldurun.");
            return;
        }

        try {
            setSending(true);
            await broadcastNotification(notifTitle, notifMessage);
            Alert.alert("Başarılı", "Bildirim tüm kullanıcılara gönderildi.");
            setModalVisible(false);
            setNotifTitle("");
            setNotifMessage("");
        } catch (e: any) {
            Alert.alert("Hata", e.message || "Bildirim gönderilemedi.");
        } finally {
            setSending(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Admin Paneli</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <Text style={styles.sectionTitle}>Genel Bakış</Text>

                {loading && !stats ? (
                    <ActivityIndicator size="large" color="#4B32C3" style={{ marginTop: 20 }} />
                ) : (
                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <View style={[styles.iconBox, { backgroundColor: '#e0e7ff' }]}>
                                <Ionicons name="people" size={24} color="#4f46e5" />
                            </View>
                            <Text style={styles.statValue}>{stats?.totalUsers || 0}</Text>
                            <Text style={styles.statLabel}>Kullanıcı</Text>
                        </View>
                        <View style={styles.statCard}>
                            <View style={[styles.iconBox, { backgroundColor: '#fef3c7' }]}>
                                <Ionicons name="calendar" size={24} color="#d97706" />
                            </View>
                            <Text style={styles.statValue}>{stats?.totalEvents || 0}</Text>
                            <Text style={styles.statLabel}>Etkinlik</Text>
                        </View>
                        <View style={[styles.statCard, { width: '100%', marginTop: 12 }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={[styles.iconBox, { backgroundColor: '#dcfce7' }]}>
                                    <Ionicons name="school" size={24} color="#16a34a" />
                                </View>
                                <View style={{ marginLeft: 12 }}>
                                    <Text style={styles.statValue}>{stats?.activeUniversities || 0}</Text>
                                    <Text style={styles.statLabel}>Aktif Üniversite</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                <Text style={[styles.sectionTitle, { marginTop: 30 }]}>Hızlı İşlemler</Text>

                <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/admin/users")}>
                    <View style={[styles.actionIcon, { backgroundColor: '#4B32C3' }]}>
                        <Ionicons name="people" size={24} color="#fff" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.actionTitle}>Kullanıcı Yönetimi</Text>
                        <Text style={styles.actionDesc}>Kullanıcıları düzenle, rol veya üniversite ata</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>

                {/* Future Features */}
                <TouchableOpacity style={styles.actionBtn} onPress={() => setModalVisible(true)}>
                    <View style={[styles.actionIcon, { backgroundColor: '#f43f5e' }]}>
                        <Ionicons name="notifications" size={24} color="#fff" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.actionTitle}>Toplu Bildirim Gönder</Text>
                        <Text style={styles.actionDesc}>Tüm kullanıcılara anlık bildirim gönderin</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>

                {/* Broadcast Modal */}
                <Modal visible={modalVisible} transparent animationType="slide">
                    <View style={styles.modalBg}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Toplu Bildirim</Text>
                                <TouchableOpacity onPress={() => setModalVisible(false)}>
                                    <Ionicons name="close" size={24} color="#333" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Bildirim Başlığı</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Örn: Yeni Etkinlik Duyurusu"
                                    value={notifTitle}
                                    onChangeText={setNotifTitle}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Bildirim Mesajı</Text>
                                <TextInput
                                    style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                                    placeholder="Mesaj içeriğini buraya yazın..."
                                    multiline
                                    numberOfLines={4}
                                    value={notifMessage}
                                    onChangeText={setNotifMessage}
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.submitBtn, sending && { opacity: 0.7 }]}
                                onPress={handleBroadcast}
                                disabled={sending}
                            >
                                {sending ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.submitBtnText}>Bildirimi Yayınla</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f5f6fa" },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    backBtn: { padding: 5 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#333' },
    content: { padding: 20 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937', marginBottom: 15 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    statCard: {
        width: '48%',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        alignItems: 'center',
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statValue: { fontSize: 24, fontWeight: '800', color: '#111' },
    statLabel: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 1,
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    actionTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
    actionDesc: { fontSize: 13, color: '#6b7280', marginTop: 2 },

    // Modal Styles
    modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#111' },
    inputGroup: { marginBottom: 15 },
    label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
    input: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 12,
        fontSize: 15,
        color: '#111',
        backgroundColor: '#f9fafb'
    },
    submitBtn: {
        backgroundColor: '#f43f5e',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10
    },
    submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 }
});
