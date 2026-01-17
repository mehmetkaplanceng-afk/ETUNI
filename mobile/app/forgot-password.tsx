import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "../api/authFetch";
import { Ionicons } from "@expo/vector-icons";

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const sendLink = async () => {
        if (!email.trim()) {
            Alert.alert("Eksik bilgi", "Lütfen e-posta adresinizi giriniz.");
            return;
        }

        try {
            setLoading(true);

            const res = await fetch(API_URL + "/api/auth/forgot-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "ngrok-skip-browser-warning": "1",
                },
                body: JSON.stringify({ email }),
            });

            const json = await res.json();

            if (json.success) {
                Alert.alert("Başarılı", json.message || "Sıfırlama bağlantısı gönderildi.", [
                    { text: "Tamam", onPress: () => router.back() }
                ]);
                setEmail("");
            } else {
                Alert.alert("Hata", json.message || "Bir hata oluştu.");
            }
        } catch (e: any) {
            console.error(e);
            Alert.alert("Bağlantı Hatası", "Sunucuya erişilemiyor.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.root}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Şifremi Unuttum</Text>
                <View style={{ width: 44 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.flex1}
            >
                <View style={styles.container}>
                    <Text style={styles.title}>Sıfırlama Bağlantısı</Text>
                    <Text style={styles.subtitle}>
                        E-posta adresini gir, sana sıfırlama bağlantısını gönderelim.
                    </Text>

                    <TextInput
                        style={styles.input}
                        placeholder="E-posta Adresi"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />

                    <TouchableOpacity style={styles.btn} onPress={sendLink} disabled={loading}>
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.btnText}>Bağlantı Gönder</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: "#f8fafc" },
    flex1: { flex: 1 },
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
    container: { flex: 1, paddingTop: 40, paddingHorizontal: 20 },
    title: { fontSize: 24, fontWeight: "900", color: "#4B32C3", marginBottom: 10 },
    subtitle: { fontSize: 15, color: "#64748b", marginBottom: 30, lineHeight: 22 },
    input: {
        backgroundColor: "#fff",
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        fontSize: 16,
        marginBottom: 20,
        color: "#1e293b",
    },
    btn: {
        backgroundColor: "#4B32C3",
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
    },
    btnText: { color: "#fff", fontWeight: "900", fontSize: 16 },
});
