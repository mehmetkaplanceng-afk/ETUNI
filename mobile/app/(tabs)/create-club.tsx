import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import authFetch from '../../api/authFetch';

export default function CreateClub() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!name.trim() || !description.trim()) {
            Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
            return;
        }

        setLoading(true);

        try {
            // Get university ID from AsyncStorage
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            const universityIdStr = await AsyncStorage.getItem('selectedUniversityId');

            if (!universityIdStr) {
                Alert.alert('Hata', 'Üniversite bilginiz bulunamadı');
                setLoading(false);
                return;
            }

            const payload = {
                universityId: parseInt(universityIdStr),
                name: name.trim(),
                description: description.trim(),
            };

            const response = await authFetch('/api/clubs', {
                method: 'POST',
                body: JSON.stringify(payload),
            });

            if (response.success) {
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
                Alert.alert('Hata', response.message || 'Kulüp oluşturulamadı');
            }
        } catch (error: any) {
            console.error('Create club error:', error);
            Alert.alert('Hata', error.message || 'Bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>Yeni Kulüp Oluştur</Text>
                    <Text style={styles.subtitle}>Üniversiteniz için yeni bir kulüp ekleyin</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Kulüp Adı</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Örn: Teknoloji Kulübü"
                            placeholderTextColor="#94a3b8"
                            value={name}
                            onChangeText={setName}
                            editable={!loading}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Açıklama</Text>
                        <TextInput
                            style={[styles.input, styles.textarea]}
                            placeholder="Kulübünüz hakkında detaylı bilgi..."
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
                            <Text style={styles.submitButtonText}>Kulübü Oluştur</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    content: {
        padding: 20,
        paddingTop: 60,
    },
    header: {
        marginBottom: 30,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#94a3b8',
    },
    form: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 8,
    },
    input: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        color: '#fff',
    },
    textarea: {
        minHeight: 120,
        paddingTop: 12,
    },
    submitButton: {
        backgroundColor: '#4f46e5',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
});
