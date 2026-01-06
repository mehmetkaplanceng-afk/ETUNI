import { Tabs, useRouter, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { Platform, View, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getToken } from "../../api/authFetch";

export default function TabLayout() {
  const router = useRouter();
  // Varsayılan olarak yükleniyor olsun, böylece ekran hemen açılmaz
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      checkAuth();
    }, [])
  );

  const checkAuth = async () => {
    try {
      const token = await getToken();
      if (!token) {
        // Token yoksa hemen Login'e şutla
        router.replace("/");
      } else {
        // Token varsa yükleniyor'u kaldır ve sekmeleri göster
        setIsLoading(false);
      }
    } catch (e) {
      // Hata durumunda da Login'e at
      router.replace("/");
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
        name="organizer"
        options={{
          title: "Organizatör",
          tabBarIcon: ({ color }) => <Ionicons name="people" size={24} color={color} />,
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