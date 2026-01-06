import { useRouter, useNavigation } from "expo-router"; // useNavigation EKLENDİ
import React, { useEffect, useState } from "react";
import { ScrollView, RefreshControl } from "react-native";
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { authFetch, clearToken } from "../../api/authFetch";
import { debug } from "../../utils/logger";
import { CommonActions } from "@react-navigation/native"; // BU GEREKLİ

type ProfileApi = {
    fullName: string;
    email: string;
    role: string;
    selectedUniversityName: string;
};

export default function ProfileScreen() {
    const router = useRouter();
    const navigation = useNavigation(); // Native navigasyon nesnesi
    const [profile, setProfile] = useState<ProfileApi | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        const res = await authFetch("/api/profile", { method: "GET" });
        if (res.ok) {
            const txt = await res.text();
            try {
                const json = JSON.parse(txt);
                setProfile(json.data || json);
            } catch (e) {
                console.error("JSON parse error:", e);
            }
        } else if (res.status === 401 || res.status === 403) {
            // Token hatası varsa sessizce çıkış yap
            await performLogout();
        }
    };

    // --- KESİN ÇIKIŞ FONKSİYONU ---
    const performLogout = async () => {
        try {
            // 1. Token'ı sil
            await clearToken();
            console.log("Token silindi. Navigasyon sıfırlanıyor...");

            // 2. NATIVE RESET İŞLEMİ (Expo Router'ı by-pass eder)
            // Bu komut geçmişi siler ve uygulamayı 'index' sayfasına zorlar.
            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [{ name: "index" }], // 'index', app/index.tsx dosyasına denk gelir
                })
            );

        } catch (e) {
            console.error("Logout Hatası:", e);
            // Hata olsa bile ana sayfaya atmayı dene
            router.replace("/");
        }
    };

    const logout = () => {
        Alert.alert(
            "Çıkış Yap",
            "Hesabınızdan çıkış yapmak istediğinize emin misiniz?",
            [
                { text: "İptal", style: "cancel" },
                {
                    text: "Çıkış Yap",
                    style: "destructive",
                    onPress: performLogout // Direkt fonksiyonu çağır
                }
            ]
        );
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadProfile();
        setRefreshing(false);
    };

    if (!profile) return <ActivityIndicator style={{ marginTop: 50 }} />;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
            <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
                <View style={styles.header}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{profile.fullName?.charAt(0) || "?"}</Text>
                    </View>
                    <Text style={styles.name}>{profile.fullName || "İsimsiz Kullanıcı"}</Text>
                    <Text style={styles.role}>{profile.role || "ROL_YOK"}</Text>
                </View>

                <View style={styles.section}>
                    <View style={styles.row}>
                        <Text style={styles.label}>E-posta</Text>
                        <Text style={styles.value}>{profile.email}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Üniversite</Text>
                        <Text style={styles.value}>{profile.selectedUniversityName || "Seçilmedi"}</Text>
                    </View>
                </View>

                <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                    <Text style={styles.logoutText}>Çıkış Yap</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: { alignItems: "center", padding: 30, backgroundColor: "#fff" },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#e0e7ff", justifyContent: "center", alignItems: "center", marginBottom: 16 },
    avatarText: { fontSize: 32, fontWeight: "800", color: "#4338ca" },
    name: { fontSize: 24, fontWeight: "800", color: "#1e293b", marginBottom: 4 },
    role: { fontSize: 14, color: "#64748b", fontWeight: "600", letterSpacing: 1 },
    section: { marginTop: 20, backgroundColor: "#fff", paddingHorizontal: 20 },
    row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
    label: { fontSize: 16, color: "#64748b" },
    value: { fontSize: 16, fontWeight: "600", color: "#1e293b" },
    logoutBtn: { margin: 20, backgroundColor: "#ef4444", padding: 16, borderRadius: 12, alignItems: "center" },
    logoutText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});