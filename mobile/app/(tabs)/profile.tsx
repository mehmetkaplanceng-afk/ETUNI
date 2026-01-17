import { useRouter, useNavigation } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, RefreshControl, TextInput, Modal } from "react-native";
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { authFetch, logoutFromServer } from "../../api/authFetch";
import { debug } from "../../utils/logger";
import { CommonActions } from "@react-navigation/native";

type University = {
    id: number;
    name: string;
};

type ProfileApi = {
    fullName: string;
    email: string;
    role: string;
    status: string;
    selectedUniversityId?: number;
    selectedUniversityName: string;
    interests?: string[];
    preferredTimeRange?: string;
};

export default function ProfileScreen() {
    const router = useRouter();
    const navigation = useNavigation();
    const [profile, setProfile] = useState<ProfileApi | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [editing, setEditing] = useState(false);

    // Edit form states
    const [editFullName, setEditFullName] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editInterests, setEditInterests] = useState("");
    const [editTimeRange, setEditTimeRange] = useState("");
    const [editUniversityId, setEditUniversityId] = useState<number | undefined>();

    const [universities, setUniversities] = useState<University[]>([]);
    const [showUniversityPicker, setShowUniversityPicker] = useState(false);
    const [showTimeRangePicker, setShowTimeRangePicker] = useState(false);

    const timeRanges = [
        { value: "", label: "Seçiniz..." },
        { value: "09-12", label: "Sabah (09:00 - 12:00)" },
        { value: "12-15", label: "Öğle (12:00 - 15:00)" },
        { value: "15-18", label: "Öğleden Sonra (15:00 - 18:00)" },
        { value: "18-21", label: "Akşam (18:00 - 21:00)" },
        { value: "21-24", label: "Gece (21:00 - 00:00)" }
    ];

    useEffect(() => {
        loadProfile();
        loadUniversities();
    }, []);

    const loadProfile = async () => {
        const res = await authFetch("/api/profile", { method: "GET" });
        if (res.ok) {
            const txt = await res.text();
            try {
                const json = JSON.parse(txt);
                const profileData = json.data || json;
                setProfile(profileData);
                // Initialize edit form with current values
                setEditFullName(profileData.fullName || "");
                setEditEmail(profileData.email || "");
                setEditInterests(profileData.interests ? profileData.interests.join(", ") : "");
                setEditTimeRange(profileData.preferredTimeRange || "");
                setEditUniversityId(profileData.selectedUniversityId);
            } catch (e) {
                console.error("JSON parse error:", e);
            }
        } else if (res.status === 401 || res.status === 403) {
            await performLogout();
        }
    };

    const loadUniversities = async () => {
        const res = await authFetch("/api/universities", { method: "GET" });
        if (res.ok) {
            const data = await res.json();
            setUniversities(data.data || data || []);
        }
    };

    const performLogout = async () => {
        try {
            console.log("Sunucu çıkışı yapılıyor...");
            await logoutFromServer();
            console.log("Hesaptan çıkış yapıldı.");

            // Allow state to settle
            setTimeout(() => {
                router.replace("/login");
            }, 100);
        } catch (e) {
            console.error("Logout Hatası:", e);
            router.replace("/login");
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
                    onPress: performLogout
                }
            ]
        );
    };

    const saveProfile = async () => {
        const updateData: any = {
            fullName: editFullName.trim(),
            email: editEmail.trim(),
        };

        if (editUniversityId) {
            updateData.universityId = editUniversityId;
        }

        if (editInterests.trim()) {
            updateData.interests = editInterests.split(",").map(s => s.trim()).filter(s => s.length > 0);
        }

        if (editTimeRange) {
            updateData.preferredTimeRange = editTimeRange;
        }

        try {
            const res = await authFetch("/api/profile/update", {
                method: "PUT",
                body: JSON.stringify(updateData)
            });

            if (res.ok) {
                Alert.alert("Başarılı", "Profil güncellendi!");
                setEditing(false);
                await loadProfile();
            } else {
                const data = await res.json();
                Alert.alert("Hata", data.message || "Güncelleme başarısız");
            }
        } catch (err) {
            console.error("Profile update error:", err);
            Alert.alert("Hata", "Bağlantı hatası");
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadProfile();
        setRefreshing(false);
    };

    const requestPromotion = async () => {
        try {
            const res = await authFetch("/api/promotion/request", {
                method: "POST"
            });

            if (res.ok) {
                Alert.alert("Başarılı", "İsteğiniz üniversite sorumlusuna iletildi.");
                await loadProfile();
            } else {
                const errorText = await res.text();
                Alert.alert("Hata", errorText || "İstek gönderilemedi");
            }
        } catch (error) {
            console.error("Promotion request error:", error);
            Alert.alert("Hata", "Bağlantı hatası");
        }
    };

    if (!profile) return <ActivityIndicator style={{ marginTop: 50 }} />;

    const selectedUniversityName = universities.find(u => u.id === editUniversityId)?.name || profile.selectedUniversityName || "Seçilmedi";
    const selectedTimeRangeLabel = timeRanges.find(t => t.value === editTimeRange)?.label || "Seçiniz...";

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
            <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
                <View style={styles.header}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{profile.fullName?.charAt(0) || "?"}</Text>
                    </View>
                    <Text style={styles.name}>{profile.fullName || "İsimsiz Kullanıcı"}</Text>
                    <Text style={styles.role}>{profile.role || "ROL_YOK"}</Text>
                    <View style={[styles.statusBadge, profile.status === "ACTIVE" ? styles.statusActive : styles.statusInactive]}>
                        <Text style={styles.statusText}>{profile.status}</Text>
                    </View>

                    {profile.role === "STUDENT" && (
                        <TouchableOpacity onPress={requestPromotion} style={styles.promotionBtn}>
                            <Text style={styles.promotionText}>🎓 Organizatör Olmak İste</Text>
                        </TouchableOpacity>
                    )}

                    {profile.role === "ADMIN" && (
                        <TouchableOpacity onPress={() => router.push("/admin/dashboard")} style={[styles.promotionBtn, { backgroundColor: '#1e293b', marginTop: 12 }]}>
                            <Text style={styles.promotionText}>🛡️ Admin Paneli</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Kişisel Bilgiler</Text>

                    {!editing ? (
                        <>
                            <View style={styles.row}>
                                <Text style={styles.label}>Ad Soyad</Text>
                                <Text style={styles.value}>{profile.fullName}</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>E-posta</Text>
                                <Text style={styles.value}>{profile.email}</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>Üniversite</Text>
                                <Text style={styles.value}>{profile.selectedUniversityName || "Seçilmedi"}</Text>
                            </View>
                        </>
                    ) : (
                        <>
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Ad Soyad</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editFullName}
                                    onChangeText={setEditFullName}
                                    placeholder="Ad Soyad"
                                />
                            </View>
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>E-posta</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editEmail}
                                    onChangeText={setEditEmail}
                                    placeholder="E-posta"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Üniversite</Text>
                                <TouchableOpacity
                                    style={styles.picker}
                                    onPress={() => setShowUniversityPicker(true)}
                                >
                                    <Text style={styles.pickerText}>{selectedUniversityName}</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Tercihlerim</Text>

                    {!editing ? (
                        <>
                            <View style={styles.row}>
                                <Text style={styles.label}>İlgi Alanları</Text>
                                <Text style={styles.value}>
                                    {profile.interests?.join(", ") || "Belirtilmedi"}
                                </Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>Tercih Zaman Aralığı</Text>
                                <Text style={styles.value}>
                                    {timeRanges.find(t => t.value === profile.preferredTimeRange)?.label || "Belirtilmedi"}
                                </Text>
                            </View>
                        </>
                    ) : (
                        <>
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>İlgi Alanları (virgülle ayırın)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editInterests}
                                    onChangeText={setEditInterests}
                                    placeholder="Teknoloji, Müzik, Spor..."
                                    multiline
                                />
                            </View>
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Tercih Zaman Aralığı</Text>
                                <TouchableOpacity
                                    style={styles.picker}
                                    onPress={() => setShowTimeRangePicker(true)}
                                >
                                    <Text style={styles.pickerText}>{selectedTimeRangeLabel}</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </View>

                {editing ? (
                    <View style={styles.buttonGroup}>
                        <TouchableOpacity
                            onPress={() => {
                                setEditing(false);
                                // Reset to original values
                                setEditFullName(profile.fullName || "");
                                setEditEmail(profile.email || "");
                                setEditInterests(profile.interests ? profile.interests.join(", ") : "");
                                setEditTimeRange(profile.preferredTimeRange || "");
                                setEditUniversityId(profile.selectedUniversityId);
                            }}
                            style={styles.cancelBtn}
                        >
                            <Text style={styles.cancelText}>İptal</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={saveProfile} style={styles.saveBtn}>
                            <Text style={styles.saveText}>💾 Kaydet</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity onPress={() => setEditing(true)} style={styles.editBtn}>
                        <Text style={styles.editText}>✏️ Profili Düzenle</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                    <Text style={styles.logoutText}>Çıkış Yap</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* University Picker Modal */}
            <Modal visible={showUniversityPicker} transparent animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Üniversite Seçin</Text>
                        <ScrollView style={styles.pickerList}>
                            {universities.map(uni => (
                                <TouchableOpacity
                                    key={uni.id}
                                    style={styles.pickerItem}
                                    onPress={() => {
                                        setEditUniversityId(uni.id);
                                        setShowUniversityPicker(false);
                                    }}
                                >
                                    <Text style={styles.pickerItemText}>{uni.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <TouchableOpacity
                            style={styles.modalCloseBtn}
                            onPress={() => setShowUniversityPicker(false)}
                        >
                            <Text style={styles.modalCloseText}>Kapat</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Time Range Picker Modal */}
            <Modal visible={showTimeRangePicker} transparent animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Zaman Aralığı Seçin</Text>
                        <ScrollView style={styles.pickerList}>
                            {timeRanges.map(range => (
                                <TouchableOpacity
                                    key={range.value}
                                    style={styles.pickerItem}
                                    onPress={() => {
                                        setEditTimeRange(range.value);
                                        setShowTimeRangePicker(false);
                                    }}
                                >
                                    <Text style={styles.pickerItemText}>{range.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <TouchableOpacity
                            style={styles.modalCloseBtn}
                            onPress={() => setShowTimeRangePicker(false)}
                        >
                            <Text style={styles.modalCloseText}>Kapat</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: { alignItems: "center", padding: 30, backgroundColor: "#fff" },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#e0e7ff", justifyContent: "center", alignItems: "center", marginBottom: 16 },
    avatarText: { fontSize: 32, fontWeight: "800", color: "#4338ca" },
    name: { fontSize: 24, fontWeight: "800", color: "#1e293b", marginBottom: 4 },
    role: { fontSize: 14, color: "#64748b", fontWeight: "600", letterSpacing: 1, marginBottom: 8 },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 4 },
    statusActive: { backgroundColor: "#dcfce7" },
    statusInactive: { backgroundColor: "#fef3c7" },
    statusText: { fontSize: 12, fontWeight: "700", color: "#166534" },
    promotionBtn: { marginTop: 16, backgroundColor: "#6366f1", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
    promotionText: { color: "#fff", fontWeight: "700", fontSize: 14, textAlign: "center" },
    section: { marginTop: 20, backgroundColor: "#fff", paddingHorizontal: 20, paddingVertical: 12 },
    sectionTitle: { fontSize: 14, fontWeight: "700", color: "#64748b", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 },
    row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
    label: { fontSize: 16, color: "#64748b" },
    value: { fontSize: 16, fontWeight: "600", color: "#1e293b", flex: 1, textAlign: "right" },
    inputContainer: { marginBottom: 16 },
    inputLabel: { fontSize: 14, fontWeight: "600", color: "#64748b", marginBottom: 8 },
    input: { backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 8, padding: 12, fontSize: 16, color: "#1e293b" },
    picker: { backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 8, padding: 12 },
    pickerText: { fontSize: 16, color: "#1e293b" },
    buttonGroup: { flexDirection: "row", gap: 12, margin: 20 },
    editBtn: { margin: 20, backgroundColor: "#3b82f6", padding: 16, borderRadius: 12, alignItems: "center" },
    editText: { color: "#fff", fontWeight: "700", fontSize: 16 },
    saveBtn: { flex: 1, backgroundColor: "#10b981", padding: 16, borderRadius: 12, alignItems: "center" },
    saveText: { color: "#fff", fontWeight: "700", fontSize: 16 },
    cancelBtn: { flex: 1, backgroundColor: "#64748b", padding: 16, borderRadius: 12, alignItems: "center" },
    cancelText: { color: "#fff", fontWeight: "700", fontSize: 16 },
    logoutBtn: { margin: 20, marginTop: 0, backgroundColor: "#ef4444", padding: 16, borderRadius: 12, alignItems: "center" },
    logoutText: { color: "#fff", fontWeight: "700", fontSize: 16 },
    modalContainer: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    modalContent: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 20, maxHeight: "80%" },
    modalTitle: { fontSize: 18, fontWeight: "700", color: "#1e293b", textAlign: "center", marginBottom: 16 },
    pickerList: { maxHeight: 400 },
    pickerItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
    pickerItemText: { fontSize: 16, color: "#1e293b" },
    modalCloseBtn: { backgroundColor: "#3b82f6", margin: 20, padding: 16, borderRadius: 12, alignItems: "center" },
    modalCloseText: { color: "#fff", fontWeight: "700", fontSize: 16 }
});
