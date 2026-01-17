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
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "../api/authFetch";
import { Ionicons } from "@expo/vector-icons";

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
        <SafeAreaView style={styles.root}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.replace("/login")} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Şifre Sıfırlama</Text>
                <View style={{ width: 44 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.flex1}
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
                        placeholderTextColor="#94a3b8"
                        secureTextEntry
                        value={newPassword}
                        onChangeText={setNewPassword}
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Yeni Şifre (Tekrar)"
                        placeholderTextColor="#94a3b8"
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
    title: { fontSize: 24, fontWeight: "900", color: "#4B32C3", marginBottom: 10, textAlign: 'center' },
    subtitle: { fontSize: 15, color: "#64748b", marginBottom: 30, textAlign: 'center' },
    input: {
        backgroundColor: "#fff",
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        fontSize: 16,
        marginBottom: 15,
        color: "#1e293b",
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
