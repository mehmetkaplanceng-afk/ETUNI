import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AdminUser, searchUsers, updateUser } from "../../api/adminApi";
import { getUniversities, University } from "../../api/universityApi";
import { debug } from "../../utils/logger";

export default function AdminUsersScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [query, setQuery] = useState("");
    const [universities, setUniversities] = useState<University[]>([]);

    // Edit Modal State
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    // Selection Modals
    const [showRoleSelect, setShowRoleSelect] = useState(false);
    const [showUniSelect, setShowUniSelect] = useState(false);

    // Form State
    const [formName, setFormName] = useState("");
    const [formEmail, setFormEmail] = useState("");
    const [formRole, setFormRole] = useState("");
    const [formUniId, setFormUniId] = useState<number | null>(null);
    const [formStatus, setFormStatus] = useState("ACTIVE");

    useEffect(() => {
        loadUsers();
        loadUniversities();
    }, []);

    const loadUsers = async (q = '') => {
        setLoading(true);
        try {
            const data = await searchUsers(q);
            setUsers(data);
        } catch (e) {
            Alert.alert("Hata", "Kullanıcılar yüklenemedi");
        } finally {
            setLoading(false);
        }
    };

    const loadUniversities = async () => {
        try {
            const data = await getUniversities();
            setUniversities(data);
        } catch (e) {
            debug("Failed to load unis", e);
        }
    };

    const handleSearch = () => {
        loadUsers(query);
    };

    const openEdit = (user: AdminUser) => {
        setEditingUser(user);
        setFormName(user.fullName);
        setFormEmail(user.email);
        setFormRole(user.role);
        setFormUniId(user.universityId);
        setFormStatus(user.status || "ACTIVE");
        setModalVisible(true);
    };

    const saveUser = async () => {
        if (!editingUser) return;
        const payload = {
            fullName: formName,
            email: formEmail,
            role: formRole,
            universityId: formUniId || undefined,
            status: formStatus
        };
        debug("ADMIN: Sending user update:", payload);
        try {
            await updateUser(editingUser.id, payload);
            Alert.alert("Başarılı", "Kullanıcı güncellendi");
            setModalVisible(false);
            loadUsers(query);
        } catch (e: any) {
            debug("ADMIN: Update failed:", e);
            Alert.alert("Hata", e.message);
        }
    };

    const renderItem = ({ item }: { item: AdminUser }) => (
        <View style={styles.card}>
            <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.fullName}</Text>
                <Text style={styles.email}>{item.email}</Text>
                <View style={styles.badges}>
                    <View style={styles.roleBadge}>
                        <Text style={styles.roleText}>{item.role}</Text>
                    </View>
                    {item.universityName && (
                        <View style={[styles.roleBadge, { backgroundColor: '#e0e7ff' }]}>
                            <Text style={[styles.roleText, { color: '#4338ca' }]}>{item.universityName}</Text>
                        </View>
                    )}
                </View>
            </View>
            <TouchableOpacity onPress={() => openEdit(item)} style={styles.editBtn}>
                <Ionicons name="create-outline" size={20} color="#4B32C3" />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Kullanıcı Yönetimi</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color="#999" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="İsim veya e-posta ara..."
                    value={query}
                    onChangeText={setQuery}
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                />
                {query.length > 0 && (
                    <TouchableOpacity onPress={() => { setQuery(''); loadUsers(''); }}>
                        <Ionicons name="close-circle" size={20} color="#999" />
                    </TouchableOpacity>
                )}
            </View>

            {loading ? (
                <ActivityIndicator style={{ marginTop: 20 }} size="large" color="#4B32C3" />
            ) : (
                <FlatList
                    data={users}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>Kullanıcı bulunamadı</Text>}
                />
            )}

            {/* Edit Modal */}
            <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Kullanıcı Düzenle</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Text style={{ color: '#4B32C3', fontSize: 16 }}>Kapat</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.form}>
                        <Text style={styles.label}>Ad Soyad</Text>
                        <TextInput style={styles.input} value={formName} onChangeText={setFormName} />

                        <Text style={styles.label}>E-posta</Text>
                        <TextInput style={styles.input} value={formEmail} onChangeText={setFormEmail} keyboardType="email-address" />

                        <Text style={styles.label}>Rol</Text>
                        <TouchableOpacity style={styles.selectBtn} onPress={() => setShowRoleSelect(true)}>
                            <Text style={{ color: '#333' }}>{formRole}</Text>
                            <Ionicons name="chevron-down" size={20} color="#999" />
                        </TouchableOpacity>

                        <Text style={styles.label}>Üniversite</Text>
                        <TouchableOpacity style={styles.selectBtn} onPress={() => setShowUniSelect(true)}>
                            <Text style={{ color: '#333' }}>
                                {universities.find(u => u.id === formUniId)?.name || 'Seçiniz...'}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color="#999" />
                        </TouchableOpacity>

                        <Text style={styles.label}>Durum</Text>
                        <TouchableOpacity
                            style={[styles.selectBtn, { backgroundColor: formStatus === 'ACTIVE' ? '#dcfce7' : '#fee2e2' }]}
                            onPress={() => setFormStatus(formStatus === 'ACTIVE' ? 'DISABLED' : 'ACTIVE')}
                        >
                            <Text style={{ color: formStatus === 'ACTIVE' ? '#16a34a' : '#dc2626', fontWeight: '700' }}>
                                {formStatus === 'ACTIVE' ? 'AKTİF' : 'PASİF'}
                            </Text>
                            <Ionicons name="swap-horizontal" size={20} color={formStatus === 'ACTIVE' ? '#16a34a' : '#dc2626'} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.saveBtn} onPress={saveUser}>
                            <Text style={styles.saveBtnText}>Kaydet</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Role Selector Modal */}
            <Modal visible={showRoleSelect} transparent animationType="fade">
                <TouchableOpacity style={styles.overlay} onPress={() => setShowRoleSelect(false)}>
                    <View style={styles.selectorContainer}>
                        {['STUDENT', 'ORGANIZER', 'UNIVERSITY_STAFF', 'ADMIN'].map(role => (
                            <TouchableOpacity key={role} style={styles.selectorItem} onPress={() => { setFormRole(role); setShowRoleSelect(false); }}>
                                <Text style={styles.selectorText}>{role}</Text>
                                {formRole === role && <Ionicons name="checkmark" size={20} color="#4B32C3" />}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* University Selector Modal */}
            <Modal visible={showUniSelect} animationType="slide">
                <View style={styles.fullScreenSelector}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Üniversite Seç</Text>
                        <TouchableOpacity onPress={() => setShowUniSelect(false)}>
                            <Text style={{ color: '#4B32C3', fontSize: 16 }}>Kapat</Text>
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={universities}
                        keyExtractor={item => item.id.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.selectorItem} onPress={() => { setFormUniId(item.id); setShowUniSelect(false); }}>
                                <Text style={styles.selectorText}>{item.name}</Text>
                                {formUniId === item.id && <Ionicons name="checkmark" size={20} color="#4B32C3" />}
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f5f6fa" },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    backBtn: { padding: 5 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 15, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#eee' },
    searchInput: { flex: 1, marginHorizontal: 10, fontSize: 16, color: '#333' },
    list: { paddingHorizontal: 15, paddingBottom: 50 },
    card: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 1 },
    name: { fontSize: 16, fontWeight: '700', color: '#333' },
    email: { fontSize: 14, color: '#666', marginTop: 2 },
    badges: { flexDirection: 'row', marginTop: 8, gap: 8 },
    roleBadge: { backgroundColor: '#f3f4f6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    roleText: { fontSize: 12, color: '#4b5563', fontWeight: '600' },
    editBtn: { padding: 10, backgroundColor: '#f5f3ff', borderRadius: 8 },
    emptyText: { textAlign: 'center', color: '#999', marginTop: 30 },

    // Modal Styles
    modalContainer: { flex: 1, backgroundColor: '#f5f6fa' },
    modalHeader: { padding: 20, paddingTop: 60, backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee' },
    modalTitle: { fontSize: 18, fontWeight: '700' },
    form: { padding: 20 },
    label: { fontSize: 14, color: '#666', marginBottom: 8, marginTop: 15, fontWeight: '600' },
    input: { backgroundColor: '#fff', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', fontSize: 16 },
    selectBtn: { backgroundColor: '#fff', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    saveBtn: { backgroundColor: '#4B32C3', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 30 },
    saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

    // Selector Styles
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    selectorContainer: { backgroundColor: '#fff', borderRadius: 16, padding: 10, maxHeight: 400 },
    fullScreenSelector: { flex: 1, backgroundColor: '#fff' },
    selectorItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', flexDirection: 'row', justifyContent: 'space-between' },
    selectorText: { fontSize: 16, color: '#333' }
});
