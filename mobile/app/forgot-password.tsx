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
import { API_URL } from "../api/authFetch";

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
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.root}
        >
            <View style={styles.container}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Text style={styles.backText}>← Geri</Text>
                </TouchableOpacity>

                <Text style={styles.title}>Şifremi Unuttum</Text>
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
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: "#f5f6fa" },
    container: { flex: 1, paddingTop: 60, paddingHorizontal: 20 },
    backBtn: { marginBottom: 20 },
    backText: { color: "#666", fontSize: 16 },
    title: { fontSize: 28, fontWeight: "900", color: "#4B32C3", marginBottom: 10 },
    subtitle: { fontSize: 16, color: "#666", marginBottom: 30, lineHeight: 22 },
    input: {
        backgroundColor: "#fff",
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#dcdde1",
        fontSize: 16,
        marginBottom: 20,
        color: "#333",
    },
    btn: {
        backgroundColor: "#4B32C3",
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
    },
    btnText: { color: "#fff", fontWeight: "900", fontSize: 16 },
});
