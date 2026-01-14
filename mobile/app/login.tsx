import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { API_URL, getToken, setToken, clearToken } from "../api/authFetch";
import { debug } from "../utils/logger";

type LoginResponse = { token: string; role: string };

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const t = await getToken();
      if (t) {
        debug("LoginScreen: Token found, redirecting to tabs");
        router.replace("/(tabs)");
      }
    })();
  }, [router]);

  const login = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Eksik bilgi", "Kullanıcı adı ve şifre giriniz.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(API_URL + "/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "1",
        },
        body: JSON.stringify({ email: username, password }),
      });

      const txt = await res.text();

      if (!res.ok) {
        Alert.alert("Giriş başarısız", `${res.status}\n${txt}`);
        return;
      }

      const json = JSON.parse(txt);

      // Handle nested API response { success: true, data: { token: '...' } }
      const token = json.data?.token || json.token;
      const user = json.data?.user || json.user;

      if (!token) {
        Alert.alert("Giriş başarısız", "Token alınamadı!");
        return;
      }

      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await setToken(token);
      if (user?.universityId) {
        await AsyncStorage.setItem("universityId", String(user.universityId));
      }
      if (user?.role) {
        await AsyncStorage.setItem("userRole", user.role);
      }

      const t = await getToken();
      debug("TOKEN CHECK AFTER SAVE:", t ? "OK" : "NULL");

      router.replace("/(tabs)");
    } catch (e: any) {
      console.error(e);
      Alert.alert("Sunucu hatası", e?.message || "Network request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.root}
    >
      <View style={styles.container}>
        <Text style={styles.title}>ETUNI Mobil</Text>
        <Text style={styles.subtitle}>Kampüs Etkinlik Platformu</Text>

        <TextInput
          style={styles.input}
          placeholder="E-posta"
          value={username}
          onChangeText={setUsername}
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

        <TouchableOpacity
          style={{ alignSelf: 'flex-end', marginBottom: 20 }}
          onPress={() => router.push("/forgot-password")}
        >
          <Text style={{ color: '#666', fontSize: 14 }}>Şifremi Unuttum?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btn} onPress={login} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Giriş Yap</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={{ marginTop: 20, alignItems: 'center' }} onPress={() => router.push("/register")}>
          <Text style={{ color: '#4B32C3', fontWeight: '600' }}>Hesabın yok mu? Kayıt Ol</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f5f6fa" },
  container: { flex: 1, paddingTop: 90, paddingHorizontal: 18 },
  title: { fontSize: 28, fontWeight: "900", textAlign: "center", marginBottom: 4, color: "#4B32C3" },
  subtitle: { fontSize: 16, textAlign: "center", marginBottom: 30, color: "#666" },
  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#dcdde1",
    fontSize: 16,
    marginBottom: 10,
  },
  btn: {
    backgroundColor: "#4B32C3",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 6,
  },
  btnText: { color: "#fff", fontWeight: "900", fontSize: 16 },
});
