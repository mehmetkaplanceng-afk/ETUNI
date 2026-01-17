import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "../api/authFetch";
import { Ionicons } from "@expo/vector-icons";

type University = {
    id: number;
    name: string;
};

export default function RegisterScreen() {
    const router = useRouter();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [universities, setUniversities] = useState<University[]>([]);
    const [selectedUniId, setSelectedUniId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [fetchingUnis, setFetchingUnis] = useState(true);
    const [showUniModal, setShowUniModal] = useState(false);
    const [uniSearch, setUniSearch] = useState("");

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(API_URL + "/api/universities", {
                    headers: { "ngrok-skip-browser-warning": "1" }
                });
                if (res.ok) {
                    const json = await res.json();
                    setUniversities(json.data || []);
                } else {
                    Alert.alert("Hata", "Üniversite listesi alınamadı.");
                }
            } catch (e) {
                console.error(e);
                Alert.alert("Hata", "Bağlantı hatası.");
            } finally {
                setFetchingUnis(false);
            }
        })();
    }, []);

    const register = async () => {
        if (!fullName.trim() || !email.trim() || !password.trim() || !selectedUniId) {
            Alert.alert("Eksik bilgi", "Lütfen tüm alanları doldurun ve üniversite seçin.");
            return;
        }

        try {
            setLoading(true);
            const res = await fetch(API_URL + "/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "ngrok-skip-browser-warning": "1",
                },
                body: JSON.stringify({
                    fullName,
                    email,
                    password,
                    universityId: selectedUniId,
                    role: "STUDENT" // Default role
                }),
            });

            const txt = await res.text();
            if (res.ok) {
                Alert.alert("Başarılı", "Kayıt oluşturuldu. Giriş yapabilirsiniz.", [
                    { text: "Tamam", onPress: () => router.replace("/login") }
                ]);
            } else {
                Alert.alert("Kayıt Başarısız", txt);
            }
        } catch (e: any) {
            Alert.alert("Hata", e.message || "Bir hata oluştu.");
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
                <Text style={styles.headerTitle}>Kayıt Ol</Text>
                <View style={{ width: 44 }} />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flex1}>
                <ScrollView contentContainerStyle={styles.container}>
                    <Text style={styles.title}>ETUNI'ye Katıl</Text>
                    <Text style={styles.subtitle}>Üniversite hayatını keşfetmeye başla</Text>

                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Ad Soyad</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Örn: Mehmet Kaplan"
                                placeholderTextColor="#94a3b8"
                                value={fullName}
                                onChangeText={setFullName}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>E-posta</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Örn: mehmet@etuni.com"
                                placeholderTextColor="#94a3b8"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Şifre</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="••••••••"
                                placeholderTextColor="#94a3b8"
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Üniversite</Text>
                            <TouchableOpacity
                                style={styles.selectBox}
                                onPress={() => setShowUniModal(true)}
                            >
                                <Text style={[styles.selectBoxText, !selectedUniId && { color: "#94a3b8" }]}>
                                    {selectedUniId
                                        ? universities.find(u => u.id === selectedUniId)?.name
                                        : "Üniversitenizi seçin"}
                                </Text>
                                <Ionicons name="chevron-forward" size={18} color="#4B32C3" />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.btn} onPress={register} disabled={loading}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Hesabımı Oluştur</Text>}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.linkBtn} onPress={() => router.replace("/login")}>
                            <Text style={styles.linkText}>Zaten hesabın var mı? <Text style={{ fontWeight: '800' }}>Giriş Yap</Text></Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* University Selection Modal */}
            <Modal
                visible={showUniModal}
                animationType="slide"
                onRequestClose={() => setShowUniModal(false)}
            >
                <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => setShowUniModal(false)} style={styles.backButton}>
                            <Ionicons name="close" size={24} color="#1e293b" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Üniversite Seçin</Text>
                        <View style={{ width: 44 }} />
                    </View>

                    <View style={{ padding: 16 }}>
                        <View style={styles.searchContainer}>
                            <Ionicons name="search" size={20} color="#94a3b8" style={{ marginRight: 8 }} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Üniversite ara..."
                                placeholderTextColor="#94a3b8"
                                value={uniSearch}
                                onChangeText={setUniSearch}
                            />
                        </View>
                    </View>

                    {fetchingUnis ? (
                        <ActivityIndicator style={{ marginTop: 20 }} color="#4B32C3" />
                    ) : (
                        <FlatList
                            data={universities.filter(u =>
                                u.name.toLowerCase().includes(uniSearch.toLowerCase())
                            )}
                            keyExtractor={(item) => String(item.id)}
                            contentContainerStyle={{ padding: 16 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.modalItem}
                                    onPress={() => {
                                        setSelectedUniId(item.id);
                                        setShowUniModal(false);
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                        <View style={[styles.uniIcon, selectedUniId === item.id && styles.uniIconActive]}>
                                            <Ionicons name="school" size={20} color={selectedUniId === item.id ? "#fff" : "#4B32C3"} />
                                        </View>
                                        <Text style={[
                                            styles.modalItemText,
                                            selectedUniId === item.id && { color: "#4B32C3", fontWeight: "700" }
                                        ]}>
                                            {item.name}
                                        </Text>
                                    </View>
                                    {selectedUniId === item.id && (
                                        <View style={styles.checkCircle}>
                                            <Ionicons name="checkmark" size={16} color="#fff" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    )}
                </SafeAreaView>
            </Modal>
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
    container: { paddingBottom: 40 },
    title: { fontSize: 26, fontWeight: "900", textAlign: "center", marginTop: 30, color: "#1e293b" },
    subtitle: { fontSize: 15, textAlign: "center", marginBottom: 30, color: "#64748b" },
    form: { paddingHorizontal: 20 },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 14, fontWeight: "700", marginBottom: 8, color: "#475569" },
    input: {
        backgroundColor: "#fff",
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        fontSize: 16,
        color: "#1e293b",
    },
    selectBox: {
        backgroundColor: "#fff",
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    selectBoxText: { fontSize: 16, color: "#1e293b" },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16,
        color: '#1e293b'
    },
    modalItem: {
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    uniIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#f5f3ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    uniIconActive: {
        backgroundColor: '#4B32C3'
    },
    modalItemText: { fontSize: 15, color: "#1e293b", flex: 1 },
    checkCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#10b981',
        justifyContent: 'center',
        alignItems: 'center'
    },
    btn: {
        backgroundColor: "#4B32C3",
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 10,
        shadowColor: "#4B32C3",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5
    },
    btnText: { color: "#fff", fontWeight: "800", fontSize: 17 },
    linkBtn: { marginTop: 20, alignItems: "center" },
    linkText: { color: "#64748b", fontSize: 14 }
});
