import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authFetch } from '../../api/authFetch';
import { Ionicons } from "@expo/vector-icons";

export default function CreateClub() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [universityId, setUniversityId] = useState<string | null>(null);

    useEffect(() => {
        const getUniId = async () => {
            let id = await AsyncStorage.getItem('universityId');
            if (!id) {
                // Fallback: try to get from profile if not in storage
                try {
                    const res = await authFetch("/api/profile", { method: "GET" });
                    if (res.ok) {
                        const json = await res.json();
                        const profileData = json.data || json;
                        if (profileData.selectedUniversityId) {
                            id = String(profileData.selectedUniversityId);
                            await AsyncStorage.setItem('universityId', id);
                        }
                    }
                } catch (e) {
                    console.error("Failed to fetch profile for university ID:", e);
                }
            }
            setUniversityId(id);
        };
        getUniId();
    }, []);

    const handleSubmit = async () => {
        if (!name.trim() || !description.trim()) {
            Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
            return;
        }

        if (!universityId) {
            Alert.alert('Hata', 'Üniversite bilginiz bulunamadı. Lütfen profilinizden üniversite seçtiğinizden emin olun.');
            return;
        }

        setLoading(true);

        try {
            const payload = {
                universityId: parseInt(universityId),
                name: name.trim(),
                description: description.trim(),
            };

            const response = await authFetch('/api/clubs', {
                method: 'POST',
                body: JSON.stringify(payload),
            });

            // Handle both response shapes (Response object or parsed success object if authFetch was modified)
            let success = false;
            let message = '';

            if (response.ok) {
                success = true;
            } else {
                try {
                    const errorJson = await response.json();
                    message = errorJson.message || 'Kulüp oluşturulamadı';
                } catch (e) {
                    message = 'Kulüp oluşturulamadı';
                }
            }

            if (success) {
                Alert.alert('Başarılı', 'Kulüp başarıyla oluşturuldu!', [
                    {
                        text: 'Tamam',
                        onPress: () => {
                            setName('');
                            setDescription('');
                            router.replace('/organizer');
                        },
                    },
                ]);
            } else {
                Alert.alert('Hata', message);
            }
        } catch (error: any) {
            console.error('Create club error:', error);
            Alert.alert('Hata', error.message || 'Bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Yeni Kulüp</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.infoBox}>
                    <Text style={styles.title}>Kulüp Bilgileri</Text>
                    <Text style={styles.subtitle}>Üniversiteniz için yeni bir topluluk başlatın.</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Kulüp Adı</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Örn: Teknoloji Kulübü"
                            placeholderTextColor="#94a3b8"
                            value={name}
                            onChangeText={setName}
                            editable={!loading}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Açıklama</Text>
                        <TextInput
                            style={[styles.input, styles.textarea]}
                            placeholder="Kulübünüzün hedefleri ve projeleri hakkında bilgi verin..."
                            placeholderTextColor="#94a3b8"
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={6}
                            textAlignVertical="top"
                            editable={!loading}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>✨ Kulübü Oluştur</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
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
    content: {
        padding: 20,
    },
    infoBox: {
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1e293b',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 15,
        color: '#64748b',
    },
    form: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 3,
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748b',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    input: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        color: '#1e293b',
    },
    textarea: {
        minHeight: 120,
        paddingTop: 14,
    },
    submitButton: {
        backgroundColor: '#4f46e5',
        padding: 16,
        borderRadius: 14,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: "#4f46e5",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonDisabled: {
        opacity: 0.6,
        shadowOpacity: 0,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
    },
});

