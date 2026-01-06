import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { API_URL } from "../api/authFetch";

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
            Alert.alert("Eksik bilgi", "Lütfen tüm lanları doldurun ve üniversite seçin.");
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
                    { text: "Tamam", onPress: () => router.replace("/") }
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
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.root}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>Kayıt Ol</Text>
                <Text style={styles.subtitle}>ETUNI Ailesine Katıl</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Ad Soyad"
                    value={fullName}
                    onChangeText={setFullName}
                />
                <TextInput
                    style={styles.input}
                    placeholder="E-posta"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Şifre"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />

                <Text style={styles.label}>Üniversite:</Text>
                <TouchableOpacity
                    style={styles.selectBox}
                    onPress={() => setShowUniModal(true)}
                >
                    <Text style={[styles.selectBoxText, !selectedUniId && { color: "#9ca3af" }]}>
                        {selectedUniId
                            ? universities.find(u => u.id === selectedUniId)?.name
                            : "Üniversite seçmek için dokunun"}
                    </Text>
                    <Text style={{ color: "#4B32C3", fontSize: 12, fontWeight: "800" }}>SEÇ</Text>
                </TouchableOpacity>

                {/* University Selection Modal */}
                <Modal
                    visible={showUniModal}
                    animationType="slide"
                    onRequestClose={() => setShowUniModal(false)}
                >
                    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Üniversite Seçin</Text>
                            <TouchableOpacity onPress={() => setShowUniModal(false)}>
                                <Text style={styles.closeBtn}>Kapat</Text>
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.searchInput}
                            placeholder="Üniversite ara..."
                            value={uniSearch}
                            onChangeText={setUniSearch}
                        />

                        {fetchingUnis ? (
                            <ActivityIndicator style={{ marginTop: 20 }} />
                        ) : (
                            <FlatList
                                data={universities.filter(u =>
                                    u.name.toLowerCase().includes(uniSearch.toLowerCase())
                                )}
                                keyExtractor={(item) => String(item.id)}
                                contentContainerStyle={{ padding: 20 }}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.modalItem}
                                        onPress={() => {
                                            setSelectedUniId(item.id);
                                            setShowUniModal(false);
                                        }}
                                    >
                                        <Text style={[
                                            styles.modalItemText,
                                            selectedUniId === item.id && { color: "#4B32C3", fontWeight: "700" }
                                        ]}>
                                            {item.name}
                                        </Text>
                                        {selectedUniId === item.id && <Text style={{ color: "#4B32C3" }}>✓</Text>}
                                    </TouchableOpacity>
                                )}
                            />
                        )}
                    </SafeAreaView>
                </Modal>

                <TouchableOpacity style={styles.btn} onPress={register} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Kayıt Ol</Text>}
                </TouchableOpacity>

                <TouchableOpacity style={styles.linkBtn} onPress={() => router.back()}>
                    <Text style={styles.linkText}>Zaten hesabın var mı? Giriş Yap</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView >
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: "#f5f6fa" },
    container: { padding: 20, paddingTop: 50 },
    title: { fontSize: 28, fontWeight: "900", textAlign: "center", marginBottom: 4, color: "#4B32C3" },
    subtitle: { fontSize: 16, textAlign: "center", marginBottom: 20, color: "#666" },
    input: {
        backgroundColor: "#fff",
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#dcdde1",
        fontSize: 16,
        marginBottom: 10,
    },
    label: { fontSize: 16, fontWeight: "600", marginTop: 10, marginBottom: 8, color: "#333" },
    selectBox: {
        backgroundColor: "#fff",
        padding: 15,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#dcdde1",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20
    },
    selectBoxText: { fontSize: 16, color: "#333" },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#eee"
    },
    modalTitle: { fontSize: 18, fontWeight: "800", color: "#4B32C3" },
    closeBtn: { color: "#666", fontWeight: "600" },
    searchInput: {
        margin: 15,
        padding: 12,
        backgroundColor: "#f5f6fa",
        borderRadius: 10,
        fontSize: 16
    },
    modalItem: {
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center"
    },
    modalItemText: { fontSize: 16, color: "#1e293b" },
    btn: {
        backgroundColor: "#4B32C3",
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: "center",
        marginTop: 10,
    },
    btnText: { color: "#fff", fontWeight: "900", fontSize: 16 },
    linkBtn: { marginTop: 20, alignItems: "center" },
    linkText: { color: "#4B32C3", fontWeight: "600" }
});
