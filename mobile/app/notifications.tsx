import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, ImageBackground, TouchableOpacity, RefreshControl } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authFetch } from '../../api/authFetch';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

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

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardContent}>
                <View style={styles.iconContainer}>
                    <Ionicons name="notifications" size={24} color="#a855f7" />
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
        <View style={styles.container}>
            <Stack.Screen options={{
                title: 'Bildirimler',
                headerStyle: { backgroundColor: '#0f172a' },
                headerTintColor: '#fff',
                headerBackTitle: 'Geri'
            }} />

            <ImageBackground
                source={{ uri: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop' }}
                style={styles.background}
            >
                <LinearGradient
                    colors={['rgba(15, 23, 42, 0.9)', 'rgba(15, 23, 42, 0.95)']}
                    style={styles.gradient}
                >
                    {loading ? (
                        <ActivityIndicator size="large" color="#a855f7" style={{ marginTop: 50 }} />
                    ) : (
                        <FlatList
                            data={notifications}
                            renderItem={renderItem}
                            keyExtractor={(item) => item.id.toString()}
                            contentContainerStyle={styles.listContent}
                            refreshControl={
                                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
                            }
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <Ionicons name="notifications-off-outline" size={48} color="rgba(255,255,255,0.5)" />
                                    <Text style={styles.emptyText}>Henüz bildiriminiz yok.</Text>
                                </View>
                            }
                        />
                    )}
                </LinearGradient>
            </ImageBackground>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    background: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },
    card: {
        backgroundColor: 'rgba(30, 41, 59, 0.7)',
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
    },
    cardContent: {
        flexDirection: 'row',
        padding: 16,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    message: {
        color: '#cbd5e1',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 8,
    },
    date: {
        color: '#64748b',
        fontSize: 12,
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
    },
});
