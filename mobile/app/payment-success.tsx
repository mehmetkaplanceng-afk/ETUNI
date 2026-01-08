import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function PaymentSuccessScreen() {
    const router = useRouter();
    const { txn, event } = useLocalSearchParams();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Success Icon */}
                <View style={styles.successIcon}>
                    <Text style={styles.checkmark}>✓</Text>
                </View>

                <Text style={styles.title}>Ödeme Başarılı!</Text>
                <Text style={styles.subtitle}>Etkinliğe başarıyla katıldınız.</Text>

                {/* Transaction Info */}
                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>İşlem No:</Text>
                        <Text style={styles.infoValue}>{txn}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Etkinlik:</Text>
                        <Text style={styles.infoValue}>{event}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Durum:</Text>
                        <Text style={[styles.infoValue, { color: '#10b981' }]}>✓ Tamamlandı</Text>
                    </View>
                </View>

                {/* Actions */}
                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => router.push('/(tabs)/tickets')}
                >
                    <Text style={styles.primaryButtonText}>Biletlerime Git</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => router.push('/(tabs)')}
                >
                    <Text style={styles.secondaryButtonText}>Etkinliklere Dön</Text>
                </TouchableOpacity>

                <Text style={styles.disclaimer}>
                    🎉 Demo ödeme sistemi kullanıldı. Gerçek ödeme yapılmamıştır.
                </Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    content: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
    successIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#10b981',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24
    },
    checkmark: { fontSize: 50, color: '#fff', fontWeight: 'bold' },
    title: { fontSize: 32, fontWeight: '800', color: '#10b981', marginBottom: 8 },
    subtitle: { fontSize: 16, color: '#64748b', marginBottom: 32 },
    infoCard: {
        width: '100%',
        backgroundColor: '#f0fdf4',
        borderWidth: 1,
        borderColor: '#bbf7d0',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12
    },
    infoLabel: { fontSize: 14, color: '#64748b' },
    infoValue: { fontSize: 14, fontWeight: '700', color: '#1e293b', fontFamily: 'monospace' },
    primaryButton: {
        width: '100%',
        backgroundColor: '#3b82f6',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12
    },
    primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
    secondaryButton: {
        width: '100%',
        padding: 14,
        alignItems: 'center'
    },
    secondaryButtonText: { color: '#64748b', fontSize: 14, fontWeight: '600' },
    disclaimer: { fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 24 }
});
