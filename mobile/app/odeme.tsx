import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { authFetch } from "../api/authFetch";

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
        const txt = await res.text().catch(() => "");
        Alert.alert(
          "Ödeme (Demo)",
          "çalışıyor."
        );
      } else {
        Alert.alert("Başarılı", "Ödeme alındı (demo).");
      }

      router.replace("/(tabs)/katılım");
    } catch (e: any) {
      console.error(e);
      Alert.alert("Hata", e?.message || "Ödeme isteği gönderilemedi");
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
        <Text style={styles.title}>💳 Ödeme</Text>

        <TextInput
          style={styles.input}
          placeholder="Ad Soyad"
          value={adSoyad}
          onChangeText={setAdSoyad}
        />

        <TextInput
          style={styles.input}
          placeholder="Kart Numarası (16 hane)"
          keyboardType="number-pad"
          value={kartNoFmt}
          onChangeText={setKartNo}
        />

        <View style={styles.row}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="AA/YY"
            keyboardType="number-pad"
            value={sonKulFmt}
            onChangeText={setSonKul}
          />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="CVC"
            keyboardType="number-pad"
            secureTextEntry
            value={cvcFmt}
            onChangeText={setCvc}
          />
        </View>

        <TouchableOpacity style={styles.payBtn} onPress={onayla} disabled={loading}>
          <Text style={styles.payBtnText}>{loading ? "İşleniyor..." : "Ödemeyi Tamamla"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} disabled={loading}>
          <Text style={styles.backBtnText}>Geri</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, paddingTop: 70, paddingHorizontal: 16 },
  title: { fontSize: 22, fontWeight: "900", textAlign: "center", marginBottom: 18 },

  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    fontSize: 16,
    marginBottom: 10,
  },
  row: { flexDirection: "row", gap: 10 },

  payBtn: {
    backgroundColor: "#16a34a",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  payBtnText: { color: "#fff", fontWeight: "900", fontSize: 16 },

  backBtn: {
    marginTop: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#4B32C3",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  backBtnText: { color: "#4B32C3", fontWeight: "900", fontSize: 16 },

  note: { textAlign: "center", color: "#666", marginTop: 14 },
});
