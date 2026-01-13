import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { authFetch } from '../api/authFetch';

export default function PaymentScreen() {
    const router = useRouter();
    const { eventId, price, title } = useLocalSearchParams();
    const [loading, setLoading] = useState(false);

    // Card details
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [cardName, setCardName] = useState('');

    const formatCardNumber = (text: string) => {
        const cleaned = text.replace(/\s/g, '');
        const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
        setCardNumber(formatted);
    };

    const formatExpiry = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        if (cleaned.length >= 2) {
            setExpiry(cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4));
        } else {
            setExpiry(cleaned);
        }
    };

    const handlePayment = async () => {
        if (!cardNumber || !expiry || !cvv || !cardName) {
            Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
            return;
        }

        setLoading(true);

        try {
            // Simulate payment processing delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Initiate payment
            const paymentRes = await authFetch('/api/payments/initiate', {
                method: 'POST',
                body: JSON.stringify({ eventId: parseInt(eventId as string) })
            });

            if (paymentRes.ok) {
                const paymentData = await paymentRes.json();

                // Join event
                const joinRes = await authFetch(`/api/attendance/join/${eventId}`, {
                    method: 'POST'
                });

                if (joinRes.ok) {
                    router.replace(`/payment-success?txn=${paymentData.data.transactionId}&event=${title}`);
                } else {
                    Alert.alert('Hata', 'Ödeme başarılı ancak etkinliğe katılım sırasında hata oluştu.');
                }
            } else {
                Alert.alert('Hata', 'Ödeme işlemi başarısız oldu.');
            }
        } catch (err) {
            console.error(err);
            Alert.alert('Hata', 'Bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollView}>
                <View style={styles.header}>
                    <Text style={styles.title}>💳 Ödeme</Text>
                    <Text style={styles.subtitle}>Güvenli ödeme ekranı</Text>
                </View>

                {/* Event Info */}
                <View style={styles.eventCard}>
                    <Text style={styles.eventTitle}>{title}</Text>
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Tutar:</Text>
                        <Text style={styles.priceValue}>₺{parseFloat(price as string).toFixed(2)}</Text>
                    </View>
                </View>

                {/* Payment Form */}
                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Kart Numarası</Text>
                        <TextInput
                            style={styles.input}
                            value={cardNumber}
                            onChangeText={formatCardNumber}
                            placeholder="1234 5678 9012 3456"
                            placeholderTextColor="#94a3b8"
                            keyboardType="numeric"
                            maxLength={19}
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>Son Kullanma</Text>
                            <TextInput
                                style={styles.input}
                                value={expiry}
                                onChangeText={formatExpiry}
                                placeholder="MM/YY"
                                placeholderTextColor="#94a3b8"
                                keyboardType="numeric"
                                maxLength={5}
                            />
                        </View>
                        <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                            <Text style={styles.label}>CVV</Text>
                            <TextInput
                                style={styles.input}
                                value={cvv}
                                onChangeText={(text) => setCvv(text.replace(/\D/g, ''))}
                                placeholder="123"
                                placeholderTextColor="#94a3b8"
                                keyboardType="numeric"
                                maxLength={3}
                                secureTextEntry
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Kart Üzerindeki İsim</Text>
                        <TextInput
                            style={[styles.input, { textTransform: 'uppercase' }]}
                            value={cardName}
                            onChangeText={setCardName}
                            placeholder="MEHMET KAPLAN"
                            placeholderTextColor="#94a3b8"
                            autoCapitalize="characters"
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.payButton, loading && styles.payButtonDisabled]}
                        onPress={handlePayment}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.payButtonText}>Ödemeyi Tamamla</Text>
                        )}
                    </TouchableOpacity>

                    <Text style={styles.disclaimer}>
                        🔒 Bu bir demo ödeme ekranıdır. Gerçek ödeme işlemi yapılmamaktadır.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    scrollView: { padding: 16, paddingBottom: 100 },
    header: { marginBottom: 24, alignItems: 'center' },
    title: { fontSize: 28, fontWeight: '800', color: '#1e293b', marginBottom: 4 },
    subtitle: { fontSize: 14, color: '#64748b' },
    eventCard: {
        backgroundColor: '#f3e8ff',
        borderWidth: 1,
        borderColor: '#d8b4fe',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24
    },
    eventTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    priceLabel: { fontSize: 14, color: '#64748b' },
    priceValue: { fontSize: 24, fontWeight: '800', color: '#a855f7' },
    form: {},
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8 },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        color: '#1e293b'
    },
    row: { flexDirection: 'row' },
    payButton: {
        backgroundColor: '#a855f7',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#a855f7',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5
    },
    payButtonDisabled: { opacity: 0.6 },
    payButtonText: { color: '#fff', fontSize: 18, fontWeight: '800' },
    disclaimer: { textAlign: 'center', fontSize: 11, color: '#94a3b8', marginTop: 16 }
});
