import { Tabs, useRouter, useFocusEffect } from "expo-router";
import React, { useCallback, useState, useEffect } from "react";
import { Platform, View, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getToken } from "../../api/authFetch";
import { debug } from "../../utils/logger";
import { registerForPushNotifications, setupNotificationListeners } from "../../utils/notificationService";

export default function TabLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // Varsayılan olarak yükleniyor olsun, böylece ekran hemen açılmaz
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Setup notification listeners
  useEffect(() => {
    const cleanup = setupNotificationListeners(
      (notification) => {
        debug("Foreground notification:", notification.request.content.title);
      },
      (response) => {
        debug("Notification tapped:", response.notification.request.content.title);
        // You can navigate based on notification data here
      }
    );

    return cleanup;
  }, []);

  useFocusEffect(
    useCallback(() => {
      checkAuth();
    }, [])
  );

  const checkAuth = async () => {
    try {
      const token = await getToken();
      if (!token) {
        debug("TabLayout: No token found, redirecting to login");
        router.replace("/login");
      } else {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const role = await AsyncStorage.getItem("userRole");
        setUserRole(role);
        setIsLoading(false);

        // Register for push notifications after successful auth
        registerForPushNotifications().catch(err => {
          debug("Failed to register for push notifications:", err);
        });
      }
    } catch (e) {
      debug("TabLayout: Auth check error, redirecting to login");
      router.replace("/login");
    }
  };

  // 1. GÜVENLİK ÖNLEMİ:
  // Token kontrolü bitmeden sekmeleri ASLA render etme.
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#e2e8f0",
          height: Platform.OS === 'ios' ? 88 : 64 + insets.bottom,
          paddingBottom: Platform.OS === 'ios' ? 30 : Math.max(insets.bottom, 4),
          paddingTop: 10,
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
        },
        tabBarActiveTintColor: "#4B32C3",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginBottom: Platform.OS === 'ios' ? 0 : 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Etkinlikler",
          tabBarIcon: ({ color }) => <Ionicons name="calendar" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tickets"
        options={{
          title: "Biletlerim",
          tabBarIcon: ({ color }) => <Ionicons name="qr-code" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Asistan",
          tabBarIcon: ({ color }) => <Ionicons name="sparkles" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Harita",
          tabBarIcon: ({ color }) => <Ionicons name="map" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="organizer"
        options={{
          title: "Organizatör",
          tabBarIcon: ({ color }) => <Ionicons name="people" size={24} color={color} />,
          href: (userRole === "ORGANIZER") ? "/organizer" : null,
        }}
      />
      <Tabs.Screen
        name="create-club"
        options={{
          title: "Kulüp Ekle",
          tabBarIcon: ({ color }) => <Ionicons name="add-circle" size={24} color={color} />,
          href: (userRole === "ORGANIZER") ? "/create-club" : null,
        }}
      />
      <Tabs.Screen
        name="staff-requests"
        options={{
          title: "Başvurular",
          tabBarIcon: ({ color }) => <Ionicons name="clipboard" size={24} color={color} />,
          href: (userRole === "UNIVERSITY_STAFF") ? "/staff-requests" : null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}