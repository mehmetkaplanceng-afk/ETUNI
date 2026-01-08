import React, { useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Platform,
    Modal,
    ActivityIndicator,
    Switch
} from "react-native";
import { WebView } from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { authFetch } from "../../api/authFetch";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function CreateEventScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [eventType, setEventType] = useState("KONFERANS");
    const [category, setCategory] = useState("Teknoloji");
    const [targetAudience, setTargetAudience] = useState("");
    const [eventDate, setEventDate] = useState("");
    const [startTime, setStartTime] = useState("");

    // Location state
    const [location, setLocation] = useState("");
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");
    const [showMapPicker, setShowMapPicker] = useState(false);

    // Price state
    const [isPaid, setIsPaid] = useState(false);
    const [price, setPrice] = useState("");

    // Modal states
    const [showTypePicker, setShowTypePicker] = useState(false);
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);

    const eventTypes = ["KONFERANS", "SEMINER", "ATOLYE", "SOSYAL", "SPOR", "KONSER", "DIGER"];
    const categories = ["Teknoloji", "Sanat", "Spor", "Kariyer", "Eglence", "Akademik", "Sosyal Sorumluluk"];

    const useCurrentLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("İzin Gerekli", "Konum izni verilmedi.");
                return;
            }

            const loc = await Location.getCurrentPositionAsync({});
            setLatitude(loc.coords.latitude.toFixed(6));
            setLongitude(loc.coords.longitude.toFixed(6));
            Alert.alert("Başarılı", "Mevcut konumunuz alındı!");
        } catch (error) {
            console.error("Location error:", error);
            Alert.alert("Hata", "Konum alınamadı.");
        }
    };

    const clearLocation = () => {
        setLocation("");
        setLatitude("");
        setLongitude("");
    };

    const handleMapMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'COORD_PICKED') {
                setLatitude(data.lat.toFixed(6));
                setLongitude(data.lng.toFixed(6));
                setShowMapPicker(false);
                Alert.alert("Konum Seçildi", "Koordinatlar başarıyla güncellendi.");
            }
        } catch (e) {
            // ignore
        }
    };

    const mapPickerHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
            body { margin: 0; padding: 0; }
            #map { width: 100%; height: 100vh; }
            .hint { 
                position: absolute; top: 10px; left: 50%; transform: translateX(-50%);
                background: white; padding: 8px 12px; border-radius: 20px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2); z-index: 1000;
                font-family: sans-serif; font-size: 12px; pointer-events: none;
            }
        </style>
    </head>
    <body>
        <div class="hint">Konum seçmek için haritaya dokunun</div>
        <div id="map"></div>
        <script>
            var map = L.map('map').setView([39.9334, 32.8597], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
            
            var marker;

            map.on('click', function(e) {
                if (marker) map.removeLayer(marker);
                marker = L.marker(e.latlng).addTo(map);
                
                setTimeout(function() {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'COORD_PICKED',
                        lat: e.latlng.lat,
                        lng: e.latlng.lng
                    }));
                }, 500);
            });
        </script>
    </body>
    </html>
    `;

    const handleSubmit = async () => {
        if (!title || !description || !targetAudience || !eventDate || !startTime) {
            Alert.alert("Hata", "Lütfen tüm zorunlu alanları doldurun.");
            return;
        }

        // Validate price if paid event
        if (isPaid && (!price || parseFloat(price) <= 0)) {
            Alert.alert("Hata", "Ücretli etkinlik için geçerli bir fiyat giriniz.");
            return;
        }

        setLoading(true);

        const uniId = await AsyncStorage.getItem("universityId") || "1";

        const payload: any = {
            universityId: parseInt(uniId),
            title,
            description,
            eventType,
            category,
            targetAudience,
            eventDate,
            startTime: startTime + ":00"
        };

        // Add location fields if provided
        if (location) payload.location = location;
        if (latitude) payload.latitude = parseFloat(latitude);
        if (longitude) payload.longitude = parseFloat(longitude);

        // Add price field
        payload.price = isPaid && price ? parseFloat(price) : 0;

        console.log("=== CREATING EVENT ===");
        console.log("Payload:", JSON.stringify(payload, null, 2));

        try {
            const res = await authFetch("/api/events", {
                method: "POST",
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                Alert.alert("Başarılı", "Etkinlik oluşturuldu!", [
                    { text: "Tamam", onPress: () => router.back() }
                ]);
            } else {
                const text = await res.text();
                console.error("=== EVENT CREATION ERROR ===");
                console.error("Status:", res.status);
                console.error("Response Text:", text);
                try {
                    const data = JSON.parse(text);
                    console.error("Parsed JSON:", data);
                    Alert.alert("Hata", data.message || `Etkinlik oluşturulamadı (${res.status})`);
                } catch (e) {
                    console.error("JSON Parse Error:", e);
                    Alert.alert("Hata", `Sunucu hatası: ${text.substring(0, 100)}`);
                }
            }
        } catch (err) {
            console.error("Create event error:", err);
            Alert.alert("Hata", "Bağlantı hatası");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <View style={styles.header}>
                    <Text style={styles.title}>Yeni Etkinlik Oluştur</Text>
                    <Text style={styles.subtitle}>Etkinlik detaylarını girerek platformda yayınlayın</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Etkinlik Başlığı *</Text>
                        <TextInput
                            style={styles.input}
                            value={title}
                            onChangeText={setTitle}
                            placeholder="Örn: Teknoloji Zirvesi 2024"
                            placeholderTextColor="#94a3b8"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Açıklama *</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Etkinlik hakkında detaylı bilgi..."
                            placeholderTextColor="#94a3b8"
                            multiline
                            numberOfLines={4}
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>Tür *</Text>
                            <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowTypePicker(true)}>
                                <Text style={styles.pickerBtnText}>{eventType}</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                            <Text style={styles.label}>Kategori *</Text>
                            <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowCategoryPicker(true)}>
                                <Text style={styles.pickerBtnText}>{category}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>Tarih *</Text>
                            <TextInput
                                style={styles.input}
                                value={eventDate}
                                onChangeText={setEventDate}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor="#94a3b8"
                            />
                        </View>
                        <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                            <Text style={styles.label}>Saat *</Text>
                            <TextInput
                                style={styles.input}
                                value={startTime}
                                onChangeText={setStartTime}
                                placeholder="HH:MM"
                                placeholderTextColor="#94a3b8"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Hedef Kitle *</Text>
                        <TextInput
                            style={styles.input}
                            value={targetAudience}
                            onChangeText={setTargetAudience}
                            placeholder="Örn: Mühendislik Öğrencileri"
                            placeholderTextColor="#94a3b8"
                        />
                    </View>

                    {/* Price Section */}
                    <View style={styles.priceSection}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <Text style={styles.sectionTitle}>💰 Etkinlik Ücreti</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={{ fontSize: 14, color: isPaid ? "#64748b" : "#3b82f6", fontWeight: '600' }}>Ücretsiz</Text>
                                <Switch
                                    value={isPaid}
                                    onValueChange={setIsPaid}
                                    trackColor={{ false: "#cbd5e1", true: "#3b82f6" }}
                                    thumbColor={isPaid ? "#fff" : "#f1f5f9"}
                                />
                                <Text style={{ fontSize: 14, color: isPaid ? "#3b82f6" : "#64748b", fontWeight: '600' }}>Ücretli</Text>
                            </View>
                        </View>

                        {isPaid && (
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Etkinlik Ücreti (₺)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={price}
                                    onChangeText={setPrice}
                                    placeholder="Örn: 50.00"
                                    placeholderTextColor="#94a3b8"
                                    keyboardType="decimal-pad"
                                />
                                <Text style={styles.hint}>💡 Ücreti Türk Lirası (₺) cinsinden girin</Text>
                            </View>
                        )}
                    </View>

                    {/* Location Section */}
                    <View style={styles.locationSection}>
                        <Text style={styles.sectionTitle}>📍 Konum Bilgileri (Opsiyonel)</Text>
                        <Text style={styles.sectionSubtitle}>
                            Etkinliğinizin haritada görünmesi için konum bilgilerini girebilirsiniz.
                        </Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Konum Adı</Text>
                            <TextInput
                                style={styles.input}
                                value={location}
                                onChangeText={setLocation}
                                placeholder="Örn: Bilkent Üniversitesi Kütüphane"
                                placeholderTextColor="#94a3b8"
                            />
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>Enlem</Text>
                                <TextInput
                                    style={styles.input}
                                    value={latitude}
                                    onChangeText={setLatitude}
                                    placeholder="39.8686"
                                    placeholderTextColor="#94a3b8"
                                    keyboardType="decimal-pad"
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                                <Text style={styles.label}>Boylam</Text>
                                <TextInput
                                    style={styles.input}
                                    value={longitude}
                                    onChangeText={setLongitude}
                                    placeholder="32.7482"
                                    placeholderTextColor="#94a3b8"
                                    keyboardType="decimal-pad"
                                />
                            </View>
                        </View>

                        <View style={styles.locationButtons}>
                            <TouchableOpacity
                                style={[styles.locationBtn, { flex: 1, backgroundColor: '#3b82f6' }]}
                                onPress={() => setShowMapPicker(true)}
                            >
                                <Text style={styles.locationBtnText}>🗺️ Haritadan Seç</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.locationBtn, { flex: 1 }]}
                                onPress={useCurrentLocation}
                            >
                                <Text style={styles.locationBtnText}>📍 Mevcut Konum</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.locationBtn, styles.clearBtn]}
                                onPress={clearLocation}
                            >
                                <Text style={styles.locationBtnText}>🗑️</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.hint}>
                            💡 Haritaya dokunarak koordinatları otomatik alabilirsiniz
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        <Text style={styles.submitBtnText}>
                            {loading ? "⏳ Oluşturuluyor..." : "Etkinliği Yayınla"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Map Picker Modal */}
            <Modal visible={showMapPicker} animationType="slide">
                <SafeAreaView style={{ flex: 1 }}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Konum Seç</Text>
                        <TouchableOpacity onPress={() => setShowMapPicker(false)}>
                            <Text style={styles.closeText}>Kapat</Text>
                        </TouchableOpacity>
                    </View>
                    <WebView
                        originWhitelist={['*']}
                        source={{ html: mapPickerHtml }}
                        onMessage={handleMapMessage}
                        style={{ flex: 1 }}
                    />
                </SafeAreaView>
            </Modal>

            {/* Event Type Picker Modal */}
            <Modal visible={showTypePicker} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.pickerModal}>
                        <Text style={styles.pickerTitle}>Etkinlik Türü</Text>
                        {eventTypes.map(t => (
                            <TouchableOpacity
                                key={t}
                                style={styles.pickerItem}
                                onPress={() => { setEventType(t); setShowTypePicker(false); }}
                            >
                                <Text style={styles.pickerItemText}>{t}</Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity style={styles.pickerClose} onPress={() => setShowTypePicker(false)}>
                            <Text style={styles.pickerCloseText}>Kapat</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Category Picker Modal */}
            <Modal visible={showCategoryPicker} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.pickerModal}>
                        <Text style={styles.pickerTitle}>Kategori</Text>
                        {categories.map(c => (
                            <TouchableOpacity
                                key={c}
                                style={styles.pickerItem}
                                onPress={() => { setCategory(c); setShowCategoryPicker(false); }}
                            >
                                <Text style={styles.pickerItemText}>{c}</Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity style={styles.pickerClose} onPress={() => setShowCategoryPicker(false)}>
                            <Text style={styles.pickerCloseText}>Kapat</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8fafc" },
    scrollView: { flex: 1 },
    header: { padding: 20, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
    title: { fontSize: 24, fontWeight: "800", color: "#1e293b", marginBottom: 4 },
    subtitle: { fontSize: 14, color: "#64748b" },
    form: { padding: 20 },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 14, fontWeight: "600", color: "#475569", marginBottom: 8 },
    input: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: "#1e293b"
    },
    textArea: { height: 100, textAlignVertical: "top" },
    row: { flexDirection: "row" },
    locationSection: {
        backgroundColor: "#eff6ff",
        borderWidth: 1,
        borderColor: "#bfdbfe",
        borderRadius: 12,
        padding: 16,
        marginBottom: 20
    },
    sectionTitle: { fontSize: 16, fontWeight: "700", color: "#3b82f6", marginBottom: 4 },
    sectionSubtitle: { fontSize: 13, color: "#64748b", marginBottom: 16 },
    priceSection: {
        backgroundColor: "#f3e8ff",
        borderWidth: 1,
        borderColor: "#d8b4fe",
        borderRadius: 12,
        padding: 16,
        marginBottom: 20
    },
    locationButtons: { flexDirection: "row", gap: 8, marginTop: 12 },
    locationBtn: {
        backgroundColor: "#64748b",
        padding: 12,
        borderRadius: 8,
        alignItems: "center"
    },
    clearBtn: { flex: 0, paddingHorizontal: 16 },
    locationBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
    hint: { fontSize: 12, color: "#64748b", marginTop: 8 },
    submitBtn: {
        backgroundColor: "#3b82f6",
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 8
    },
    submitBtnDisabled: { opacity: 0.5 },
    submitBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
    // Missing Styles
    pickerBtn: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 8, padding: 12, height: 48, justifyContent: 'center' },
    pickerBtnText: { fontSize: 16, color: "#1e293b" },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
    closeText: { color: '#3b82f6', fontWeight: 'bold' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    pickerModal: { backgroundColor: '#fff', width: '80%', borderRadius: 16, padding: 20, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
    pickerTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 15, textAlign: 'center' },
    pickerItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    pickerItemText: { fontSize: 16, color: '#475569', textAlign: 'center' },
    pickerClose: { marginTop: 15, padding: 12, backgroundColor: '#f1f5f9', borderRadius: 8 },
    pickerCloseText: { color: '#64748b', fontWeight: '700', textAlign: 'center' }
});
