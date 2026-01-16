import { Tabs, useRouter, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { Platform, View, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getToken } from "../../api/authFetch";
import { debug } from "../../utils/logger";

export default function TabLayout() {
  const router = useRouter();
  // Varsayılan olarak yükleniyor olsun, böylece ekran hemen açılmaz
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

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
        tabBarStyle: Platform.select({
          ios: {
            position: "absolute",
          },
          default: {},
        }),
        tabBarActiveTintColor: "#4B32C3",
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
          href: (userRole === "ORGANIZER" || userRole === "UNIVERSITY_STAFF" || userRole === "ADMIN") ? "/organizer" : null,
        }}
      />
      <Tabs.Screen
        name="create-club"
        options={{
          title: "Kulüp Ekle",
          tabBarIcon: ({ color }) => <Ionicons name="add-circle" size={24} color={color} />,
          href: (userRole === "ORGANIZER" || userRole === "UNIVERSITY_STAFF" || userRole === "ADMIN") ? "/create-club" : null,
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