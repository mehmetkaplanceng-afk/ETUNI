import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";
import { authFetch } from "../api/authFetch";
import { Ionicons } from "@expo/vector-icons";

export default function Odeme() {
  const router = useRouter();

  const [adSoyad, setAdSoyad] = useState("");
  const [kartNo, setKartNo] = useState("");
  const [sonKul, setSonKul] = useState("");
  const [cvc, setCvc] = useState("");
  const [loading, setLoading] = useState(false);

  const kartNoFmt = useMemo(() => kartNo.replace(/\D/g, "").slice(0, 16), [kartNo]);
  const cvcFmt = useMemo(() => cvc.replace(/\D/g, "").slice(0, 4), [cvc]);
  const sonKulFmt = useMemo(() => sonKul.replace(/[^\d/]/g, "").slice(0, 5), [sonKul]);

  const onayla = async () => {
    if (!adSoyad.trim() || kartNoFmt.length < 16 || sonKulFmt.length < 4 || cvcFmt.length < 3) {
      Alert.alert("Eksik/Hatalı", "Lütfen kart bilgilerini kontrol edin.");
      return;
    }

    try {
      setLoading(true);

      const res = await authFetch("/api/katılım/onayla", { method: "POST" });

      if (!res.ok) {
        Alert.alert("Ödeme (Demo)", "Ödeme işlemi simüle ediliyor.");
      } else {
        Alert.alert("Başarılı", "Ödeme alındı (demo).");
      }

      router.replace("/(tabs)/tickets");
    } catch (e: any) {
      console.error(e);
      Alert.alert("Hata", e?.message || "Ödeme isteği gönderilemedi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ödeme</Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex1}
      >
        <View style={styles.container}>
          <Text style={styles.title}>💳 Kart Bilgileri</Text>
          <Text style={styles.subtitle}>İşlemi tamamlamak için bilgileri doldurun</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ad Soyad</Text>
            <TextInput
              style={styles.input}
              placeholder="Kart Üzerindeki İsim"
              placeholderTextColor="#94a3b8"
              value={adSoyad}
              onChangeText={setAdSoyad}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Kart Numarası</Text>
            <TextInput
              style={styles.input}
              placeholder="1234 5678 9012 3456"
              placeholderTextColor="#94a3b8"
              keyboardType="number-pad"
              value={kartNoFmt}
              onChangeText={setKartNo}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Son Kullanma</Text>
              <TextInput
                style={styles.input}
                placeholder="AA/YY"
                placeholderTextColor="#94a3b8"
                keyboardType="number-pad"
                value={sonKulFmt}
                onChangeText={setSonKul}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>CVC</Text>
              <TextInput
                style={styles.input}
                placeholder="123"
                placeholderTextColor="#94a3b8"
                keyboardType="number-pad"
                secureTextEntry
                value={cvcFmt}
                onChangeText={setCvc}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.payBtn} onPress={onayla} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.payBtnText}>Ödemeyi Tamamla</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8fafc" },
  flex1: { flex: 1 },
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
  container: { flex: 1, paddingTop: 30, paddingHorizontal: 20 },
  title: { fontSize: 24, fontWeight: "900", color: "#1e293b", marginBottom: 8 },
  subtitle: { fontSize: 15, color: "#64748b", marginBottom: 30 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "700", marginBottom: 8, color: "#475569" },
  input: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    fontSize: 16,
    color: "#1e293b",
  },
  row: { flexDirection: "row", gap: 12 },
  payBtn: {
    backgroundColor: "#4B32C3",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#4B32C3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5
  },
  payBtnText: { color: "#fff", fontWeight: "800", fontSize: 17 },
});
