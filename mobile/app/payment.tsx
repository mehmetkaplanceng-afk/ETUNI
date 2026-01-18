import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { authFetch } from '../api/authFetch';
import { WebView } from 'react-native-webview';

export default function PaymentScreen() {
    const router = useRouter();
    const { eventId, price, title } = useLocalSearchParams();
    const [loading, setLoading] = useState(false);
    const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

    const initiateIyzicoPayment = async () => {
        setLoading(true);
        try {
            const res = await authFetch('/api/payments/initiate', {
                method: 'POST',
                body: JSON.stringify({ eventId: parseInt(eventId as string) })
            });

            const json = await res.json();
            if (json.success && json.data.paymentUrl) {
                setPaymentUrl(json.data.paymentUrl);
            } else {
                Alert.alert('Hata', json.message || 'Ödeme başlatılamadı.');
            }
        } catch (err) {
            console.error(err);
            Alert.alert('Hata', 'Sunucuya bağlanılamadı.');
        } finally {
            setLoading(false);
        }
    };

    const onNavigationStateChange = (navState: any) => {
        const url = navState.url;

        // Handle deep links OR standard web success page
        // This ensures that even if etuni:// fails, loading the success page triggers the app flow
        if (url.includes('etuni://payments/success') || url.includes('/payment/success')) {
            // Extract txn if needed, but for now just redirect
            router.replace('/(tabs)/tickets');
            Alert.alert('Başarılı', 'Ödemeniz alındı ve biletiniz oluşturuldu.');
        } else if (url.includes('etuni://payments/error') || url.includes('/payment/error')) {
            setPaymentUrl(null);
            Alert.alert('Hata', 'Ödeme işlemi iptal edildi veya başarısız oldu.');
        }
    };

    if (paymentUrl) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => setPaymentUrl(null)} style={styles.backButton}>
                        <Ionicons name="close" size={24} color="#1e293b" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Ödeme Sayfası</Text>
                    <View style={{ width: 44 }} />
                </View>
                <WebView
                    source={{ uri: paymentUrl }}
                    onNavigationStateChange={onNavigationStateChange}
                    startInLoadingState={true}
                    renderLoading={() => (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#4f46e5" />
                        </View>
                    )}
                />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Ödeme Onayı</Text>
                <View style={{ width: 44 }} />
            </View>

            <View style={styles.content}>
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>{title}</Text>
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Toplam Tutar:</Text>
                        <Text style={styles.priceValue}>₺{parseFloat(price as string).toFixed(2)}</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.payButton, loading && styles.payButtonDisabled]}
                    onPress={initiateIyzicoPayment}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <View style={styles.buttonContent}>
                            <Ionicons name="lock-closed" size={20} color="#fff" style={{ marginRight: 8 }} />
                            <Text style={styles.payButtonText}>Güvenli Öde</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <View style={styles.infoBox}>
                    <Ionicons name="shield-checkmark" size={24} color="#059669" />
                    <Text style={styles.infoText}>
                        Ödemeniz 256-bit SSL şifreleme ile korunmaktadır.
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
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
    backButton: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
    content: { padding: 20, flex: 1, justifyContent: 'center' },
    card: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 30,
        marginBottom: 30,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 10,
        borderWidth: 1,
        borderColor: '#f1f5f9'
    },
    cardTitle: { fontSize: 22, fontWeight: '800', color: '#1e293b', marginBottom: 20, textAlign: 'center' },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    priceLabel: { fontSize: 16, color: '#64748b' },
    priceValue: { fontSize: 32, fontWeight: '800', color: '#4f46e5' },
    payButton: {
        backgroundColor: '#4f46e5',
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#4f46e5',
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8
    },
    buttonContent: { flexDirection: 'row', alignItems: 'center' },
    payButtonDisabled: { opacity: 0.7 },
    payButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
    loadingContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.8)' },
    infoBox: { flexDirection: 'row', alignItems: 'center', marginTop: 40, paddingHorizontal: 20 },
    infoText: { flex: 1, marginLeft: 12, fontSize: 13, color: '#475569', lineHeight: 18 }
});
