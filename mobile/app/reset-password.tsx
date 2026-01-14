import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useState, useEffect } from "react";
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

export default function ResetPasswordScreen() {
    const router = useRouter();
    const params = useLocalSearchParams(); // expects ?token=...

    const [token, setToken] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (params.token) {
            setToken(Array.isArray(params.token) ? params.token[0] : params.token);
        }
    }, [params.token]);

    const reset = async () => {
        if (!token) {
            Alert.alert("Hata", "Token bulunamadı. Lütfen linke tekrar tıklayın.");
            return;
        }
        if (newPassword.length < 6) {
            Alert.alert("Hata", "Şifre en az 6 karakter olmalıdır.");
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert("Hata", "Şifreler uyuşmuyor.");
            return;
        }

        try {
            setLoading(true);

            const res = await fetch(API_URL + "/api/auth/reset-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "ngrok-skip-browser-warning": "1",
                },
                body: JSON.stringify({ token, newPassword }),
            });

            const json = await res.json();

            if (json.success) {
                Alert.alert("Başarılı", "Şifreniz güncellendi. Giriş yapabilirsiniz.", [
                    { text: "Giriş Yap", onPress: () => router.replace("/login") }
                ]);
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
                <Text style={styles.title}>Yeni Şifre Belirle</Text>
                <Text style={styles.subtitle}>
                    Lütfen hesabınız için yeni bir şifre girin.
                </Text>

                {!token && (
                    <TextInput
                        style={styles.input}
                        placeholder="Token (Linkten otomatik gelmeli)"
                        value={token}
                        onChangeText={setToken}
                    />
                )}

                <TextInput
                    style={styles.input}
                    placeholder="Yeni Şifre"
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                />

                <TextInput
                    style={styles.input}
                    placeholder="Yeni Şifre (Tekrar)"
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                />

                <TouchableOpacity style={styles.btn} onPress={reset} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.btnText}>Şifreyi Güncelle</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity style={{ marginTop: 20, alignItems: 'center' }} onPress={() => router.replace("/login")}>
                    <Text style={{ color: '#666' }}>Giriş sayfasına dön</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: "#f5f6fa" },
    container: { flex: 1, paddingTop: 80, paddingHorizontal: 20 },
    title: { fontSize: 26, fontWeight: "900", color: "#4B32C3", marginBottom: 10, textAlign: 'center' },
    subtitle: { fontSize: 16, color: "#666", marginBottom: 30, textAlign: 'center' },
    input: {
        backgroundColor: "#fff",
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#dcdde1",
        fontSize: 16,
        marginBottom: 15,
        color: "#333",
    },
    btn: {
        backgroundColor: "#4B32C3",
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 10
    },
    btnText: { color: "#fff", fontWeight: "900", fontSize: 16 },
});
