import React, { useEffect, useState } from "react";
import { ScrollView, RefreshControl, Alert, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { authFetch } from "../../api/authFetch";

type PromotionRequest = {
    id: number;
    userId: number;
    userFullName: string;
    userEmail: string;
    status: string;
    createdAt: string;
};

export default function StaffRequestsScreen() {
    const [requests, setRequests] = useState<PromotionRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        try {
            const res = await authFetch("/api/promotion/pending", { method: "GET" });
            if (res.ok) {
                const data = await res.json();
                setRequests(data);
            } else {
                Alert.alert("Hata", "Başvurular yüklenemedi");
            }
        } catch (error) {
            console.error("Error loading requests:", error);
            Alert.alert("Hata", "Bağlantı hatası");
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadRequests();
        setRefreshing(false);
    };

    const handleApprove = async (requestId: number) => {
        Alert.alert(
            "Onayla",
            "Bu başvuruyu onaylamak istediğinize emin misiniz?",
            [
                { text: "İptal", style: "cancel" },
                {
                    text: "Onayla",
                    onPress: async () => {
                        try {
                            const res = await authFetch(`/api/promotion/approve/${requestId}`, {
                                method: "POST"
                            });

                            if (res.ok) {
                                Alert.alert("Başarılı", "Başvuru onaylandı");
                                await loadRequests();
                            } else {
                                const errorText = await res.text();
                                Alert.alert("Hata", errorText);
                            }
                        } catch (error) {
                            console.error("Approve error:", error);
                            Alert.alert("Hata", "Bağlantı hatası");
                        }
                    }
                }
            ]
        );
    };

    const handleReject = async (requestId: number) => {
        Alert.alert(
            "Reddet",
            "Bu başvuruyu reddetmek istediğinize emin misiniz?",
            [
                { text: "İptal", style: "cancel" },
                {
                    text: "Reddet",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const res = await authFetch(`/api/promotion/reject/${requestId}`, {
                                method: "POST"
                            });

                            if (res.ok) {
                                Alert.alert("Başarılı", "Başvuru reddedildi");
                                await loadRequests();
                            } else {
                                const errorText = await res.text();
                                Alert.alert("Hata", errorText);
                            }
                        } catch (error) {
                            console.error("Reject error:", error);
                            Alert.alert("Hata", "Bağlantı hatası");
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 50 }} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Organizatör Başvuruları</Text>
                    <Text style={styles.headerSubtitle}>
                        {requests.length} bekleyen başvuru
                    </Text>
                </View>

                {requests.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>📋</Text>
                        <Text style={styles.emptyTitle}>Bekleyen Başvuru Yok</Text>
                        <Text style={styles.emptyText}>Şu anda onaylanmayı bekleyen organizatör başvurusu bulunmuyor.</Text>
                    </View>
                ) : (
                    <View style={styles.requestsList}>
                        {requests.map((request) => (
                            <View key={request.id} style={styles.requestCard}>
                                <View style={styles.requestInfo}>
                                    <Text style={styles.requestName}>{request.userFullName}</Text>
                                    <Text style={styles.requestEmail}>{request.userEmail}</Text>
                                    <Text style={styles.requestDate}>
                                        {new Date(request.createdAt).toLocaleDateString('tr-TR', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </Text>
                                </View>
                                <View style={styles.actionsContainer}>
                                    <TouchableOpacity
                                        style={styles.approveButton}
                                        onPress={() => handleApprove(request.id)}
                                    >
                                        <Text style={styles.approveButtonText}>✓ Onayla</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.rejectButton}
                                        onPress={() => handleReject(request.id)}
                                    >
                                        <Text style={styles.rejectButtonText}>✕ Reddet</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8fafc"
    },
    header: {
        padding: 24,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0"
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: "800",
        color: "#1e293b",
        marginBottom: 4
    },
    headerSubtitle: {
        fontSize: 14,
        color: "#64748b",
        fontWeight: "600"
    },
    emptyState: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 80,
        paddingHorizontal: 40
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1e293b",
        marginBottom: 8
    },
    emptyText: {
        fontSize: 14,
        color: "#64748b",
        textAlign: "center",
        lineHeight: 20
    },
    requestsList: {
        padding: 16
    },
    requestCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2
    },
    requestInfo: {
        marginBottom: 16
    },
    requestName: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1e293b",
        marginBottom: 4
    },
    requestEmail: {
        fontSize: 14,
        color: "#64748b",
        marginBottom: 8
    },
    requestDate: {
        fontSize: 12,
        color: "#94a3b8"
    },
    actionsContainer: {
        flexDirection: "row",
        gap: 12
    },
    approveButton: {
        flex: 1,
        backgroundColor: "#10b981",
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: "center"
    },
    approveButtonText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "700"
    },
    rejectButton: {
        flex: 1,
        backgroundColor: "#ef4444",
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: "center"
    },
    rejectButtonText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "700"
    }
});
