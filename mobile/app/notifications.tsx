import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authFetch } from '../api/authFetch';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NotificationsScreen() {
    const router = useRouter();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadNotifications = async () => {
        try {
            const res = await authFetch('/api/notifications');
            if (res.status === 401) {
                router.replace('/login');
                return;
            }
            const json = await res.json();
            if (json.success) {
                setNotifications(json.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadNotifications();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadNotifications();
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardContent}>
                <View style={styles.iconContainer}>
                    <Ionicons name="notifications" size={24} color="#4f46e5" />
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.message}>{item.message}</Text>
                    <Text style={styles.date}>
                        {item.createdAt ? new Date(item.createdAt).toLocaleString('tr-TR') : ''}
                    </Text>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Bildirimler</Text>
                <View style={{ width: 44 }} />
            </View>

            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4f46e5" />
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={renderItem}
                    keyExtractor={(item: any) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4f46e5" />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="notifications-off-outline" size={64} color="#cbd5e1" />
                            <Text style={styles.emptyText}>Henüz bildiriminiz yok.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    cardContent: {
        flexDirection: 'row',
        padding: 16,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#f5f3ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        color: '#1e293b',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    message: {
        color: '#475569',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 8,
    },
    date: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: '500',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyText: {
        color: '#94a3b8',
        fontSize: 16,
        marginTop: 16,
        fontWeight: '600',
    },
});

