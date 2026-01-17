import React, { useEffect, useState, useRef } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Linking,
    Platform
} from "react-native";
import { WebView } from 'react-native-webview';
import { authFetch } from "../../api/authFetch";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";

type Event = {
    id: number;
    title: string;
    eventDate: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    description?: string;
};

export default function MapScreen() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const webviewRef = useRef<WebView>(null);

    useEffect(() => {
        // Parallel fetching
        Promise.all([getUserLocation(), loadEvents()]).finally(() => {
            setLoading(false);
        });
    }, []);

    // Update markers when events or user location changes
    useEffect(() => {
        if (!loading) {
            updateMapMarkers();
        }
    }, [events, userLocation, loading]);

    const getUserLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("Konum İzni", "Harita özelliğini kullanmak için konum izni gereklidir.");
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            setUserLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            });
        } catch (error) {
            console.error("Location error:", error);
        }
    };

    const loadEvents = async () => {
        try {
            const uniId = await AsyncStorage.getItem("universityId") || "1";
            const res = await authFetch(`/api/events/university/${uniId}`, { method: "GET" });
            if (res.ok) {
                const json = await res.json();
                const allEvents = json.data || [];
                // Filter events with location
                const eventsWithLocation = allEvents.filter(
                    (e: Event) => e.latitude && e.longitude
                );
                setEvents(eventsWithLocation);
            }
        } catch (err) {
            console.error("Events loading error:", err);
        }
    };

    const updateMapMarkers = () => {
        const data = {
            type: 'UPDATE_MARKERS',
            events: events,
            userLocation: userLocation
        };
        webviewRef.current?.postMessage(JSON.stringify(data));
    };

    const handleMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'MARKER_PRESS') {
                const eventId = data.id;
                const found = events.find(e => e.id === eventId);
                if (found) setSelectedEvent(found);
            }
        } catch (e) {
            // ignore
        }
    };

    const openNavigation = (event: Event) => {
        if (!event.latitude || !event.longitude) return;

        const scheme = Platform.select({
            ios: "maps:0,0?q=",
            android: "geo:0,0?q="
        });
        const latLng = `${event.latitude},${event.longitude}`;
        const label = event.title;
        const url = Platform.select({
            ios: `${scheme}${label}@${latLng}`,
            android: `${scheme}${latLng}(${label})`
        });

        if (url) {
            Linking.openURL(url);
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "Tarih belirtilmemiş";
        const date = new Date(dateStr);
        return date.toLocaleDateString("tr-TR", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    // --- HTML CONTENT FOR WEBVIEW ---
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin=""/>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
        <style>
            body { margin: 0; padding: 0; }
            #map { width: 100%; height: 100vh; }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <script>
            var map = L.map('map').setView([${userLocation ? userLocation.latitude : 39.9334}, ${userLocation ? userLocation.longitude : 32.8597}], 13);
            
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; OpenStreetMap'
            }).addTo(map);

            var markers = {};
            var userMarker = null;

            function updateMarkers(events, userLocation) {
                // Clear existing markers
                for (var id in markers) {
                    map.removeLayer(markers[id]);
                }
                markers = {};

                // Add User Location
                if (userLocation) {
                    if (userMarker) map.removeLayer(userMarker);
                    var userIcon = L.icon({
                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34],
                        shadowSize: [41, 41]
                    });
                    userMarker = L.marker([userLocation.latitude, userLocation.longitude], {icon: userIcon})
                        .addTo(map)
                        .bindPopup("Konumunuz");
                }

                // Add Event Markers
                var redIcon = L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                });

                events.forEach(function(e) {
                    if(e.latitude && e.longitude) {
                        var m = L.marker([e.latitude, e.longitude], {icon: redIcon}).addTo(map);
                        m.on('click', function() {
                            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MARKER_PRESS', id: e.id }));
                        });
                        markers[e.id] = m;
                    }
                });
            }

            // Listen for messages from React Native
            document.addEventListener("message", function(event) {
                handleRNMessage(event);
            });
            window.addEventListener("message", function(event) {
                handleRNMessage(event);
            });

            function handleRNMessage(event) {
                try {
                    var data = JSON.parse(event.data);
                    if (data.type === 'UPDATE_MARKERS') {
                        updateMarkers(data.events, data.userLocation);
                        if (data.userLocation && !userMarker) {
                             map.setView([data.userLocation.latitude, data.userLocation.longitude], 13);
                        }
                    }
                } catch(e) {}
            }
        </script>
    </body>
    </html>
    `;

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <ActivityIndicator style={{ marginTop: 50 }} size="large" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>🗺️ Etkinlik Haritası</Text>
                <Text style={styles.subtitle}>
                    {events.length} konum işaretli etkinlik
                </Text>
            </View>

            <View style={{ flex: 1 }}>
                <WebView
                    ref={webviewRef}
                    originWhitelist={['*']}
                    source={{ html: htmlContent }}
                    style={{ flex: 1 }}
                    onLoadEnd={updateMapMarkers}
                    onMessage={handleMessage}
                />
            </View>

            {selectedEvent && (
                <View style={styles.eventCard}>
                    <View style={styles.eventCardHeader}>
                        <Text style={styles.eventCardTitle} numberOfLines={2}>
                            {selectedEvent.title}
                        </Text>
                        <TouchableOpacity onPress={() => setSelectedEvent(null)}>
                            <Text style={styles.closeButton}>✕</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.eventCardDate}>
                        📅 {formatDate(selectedEvent.eventDate)}
                    </Text>
                    <Text style={styles.eventCardLocation}>
                        📍 {selectedEvent.location || "Konum belirtilmemiş"}
                    </Text>
                    {selectedEvent.description && (
                        <Text style={styles.eventCardDescription} numberOfLines={3}>
                            {selectedEvent.description}
                        </Text>
                    )}
                    <View style={styles.eventCardActions}>
                        <TouchableOpacity
                            style={styles.navigateBtn}
                            onPress={() => openNavigation(selectedEvent)}
                        >
                            <Text style={styles.navigateBtnText}>🧭 Yol Tarifi</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            <View style={styles.eventListContainer}>
                <Text style={styles.listTitle}>📍 Haritadaki Etkinlikler</Text>
                <FlatList
                    data={events}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.eventListItem}
                            onPress={() => {
                                setSelectedEvent(item);
                                if (item.latitude && item.longitude) {
                                    // Optional: center map on press via webview message
                                }
                            }}
                        >
                            <Text style={styles.eventListTitle} numberOfLines={2}>
                                {item.title}
                            </Text>
                            <Text style={styles.eventListLocation} numberOfLines={1}>
                                📍 {item.location || "Konum belirtilmemiş"}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8fafc" },
    header: { padding: 20, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
    title: { fontSize: 24, fontWeight: "800", color: "#1e293b", marginBottom: 4 },
    subtitle: { fontSize: 14, color: "#64748b" },
    eventCard: {
        position: "absolute",
        bottom: 110, // Sit above the list
        left: 20,
        right: 20,
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
        zIndex: 10
    },
    eventCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
    eventCardTitle: { fontSize: 18, fontWeight: "700", color: "#1e293b", flex: 1, marginRight: 8 },
    closeButton: { fontSize: 24, color: "#64748b", fontWeight: "700" },
    eventCardDate: { fontSize: 14, color: "#64748b", marginBottom: 4 },
    eventCardLocation: { fontSize: 14, color: "#64748b", marginBottom: 8 },
    eventCardDescription: { fontSize: 13, color: "#94a3b8", marginBottom: 12 },
    eventCardActions: { flexDirection: "row", gap: 8 },
    navigateBtn: { flex: 1, backgroundColor: "#3b82f6", padding: 12, borderRadius: 8, alignItems: "center" },
    navigateBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
    eventListContainer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#fff",
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: "#e2e8f0",
        height: 100
    },
    listTitle: { fontSize: 14, fontWeight: "700", color: "#64748b", paddingHorizontal: 20, marginBottom: 8 },
    eventListItem: {
        width: 200,
        backgroundColor: "#f8fafc",
        borderRadius: 12,
        padding: 12,
        marginLeft: 12,
        borderWidth: 1,
        borderColor: "#e2e8f0"
    },
    eventListTitle: { fontSize: 14, fontWeight: "700", color: "#1e293b", marginBottom: 4 },
    eventListLocation: { fontSize: 12, color: "#64748b" }
});
