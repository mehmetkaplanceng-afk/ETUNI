import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, Button } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { authFetch } from '../../api/authFetch';
import { useRouter, useLocalSearchParams } from 'expo-router'; // useLocalSearchParams EKLENDİ
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OrganizerScan() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // --- DÜZELTME BURADA ---
  // params.eventId bazen ["5"] (array) bazen "5" (string) gelebilir.
  // Bunu garanti bir şekilde sayıya çevirelim.
  const rawId = Array.isArray(params.eventId) ? params.eventId[0] : params.eventId;
  const currentEventId = rawId ? parseInt(rawId, 10) : null;

  // Debug için ekrana yazdıralım (Uygulamayı çalıştırınca terminale bak)
  console.log("Scan Sayfası Açıldı. Alınan Event ID:", currentEventId);

  const [code, setCode] = useState('');
  const [permission, requestPermission] = useCameraPermissions();

  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null);

  // Güvenli Geri Dönüş
  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);
    await processQrPayload(data);
  };

  const processQrPayload = async (payload: string) => {
    setLoading(true);
    try {
      const res = await authFetch('/api/attendance/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrPayload: payload,
          currentEventId: currentEventId // <--- BURASI ÇOK ÖNEMLİ
        }),
      });
      const txt = await res.text();
      const json = JSON.parse(txt);
      const data = json.data || json;

      // ÖZEL HATA KONTROLÜ: YANLIŞ ETKİNLİK
      if (data.message === 'WRONG_EVENT') {
        setScanResult({ success: false, message: 'Bu bilet BAŞKA bir etkinliğe ait!' });
        // Hata mesajını 2.5 saniye göster (biraz daha uzun kalsın ki okusunlar)
        setTimeout(() => { setScanResult(null); setScanned(false); }, 2500);
      }
      else if (res.ok && data && (data.valid === true || data.valid === 'true')) {
        // BAŞARILI DURUM
        setScanResult({ success: true, message: data.message || 'Giriş Başarılı!' });
        setTimeout(() => {
          setScanResult(null);
          setScanned(false);
          handleGoBack();
        }, 1500);
      }
      else {
        // DİĞER HATALAR (Geçersiz QR, Süresi Dolmuş vb.)
        setScanResult({ success: false, message: data.message || 'QR doğrulanamadı' });
        setTimeout(() => { setScanResult(null); setScanned(false); }, 2000);
      }
    } catch (e: any) {
      setScanResult({ success: false, message: e?.message || 'İstek başarısız' });
      setTimeout(() => { setScanResult(null); setScanned(false); }, 2000);
    } finally {
      setLoading(false);
    }
  };

  const validateManualCode = async (c: string) => {
    if (!c || c.trim().length === 0) {
      Alert.alert('Hata', 'Lütfen bir kod girin.');
      return;
    }
    setLoading(true);
    try {
      // Manual kod girişinde de eventId kontrolü yapmak istersen backend'de validate-code endpointini de güncellemen gerekir.
      // Şimdilik sadece QR için yaptık.
      const res = await authFetch('/api/attendance/validate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: c.trim() }),
      });
      const txt = await res.text();
      const json = JSON.parse(txt);
      const data = json.data || json;

      if (res.ok && data && (data.valid === true || data.valid === 'true')) {
        setScanResult({ success: true, message: data.message || 'Giriş Başarılı!' });
        setTimeout(() => {
          setScanResult(null);
          handleGoBack();
        }, 1500);
      } else {
        setScanResult({ success: false, message: data.message || 'Kod doğrulanamadı.' });
        setTimeout(() => setScanResult(null), 2000);
      }
    } catch (e: any) {
      Alert.alert('Sunucu hatası', e?.message || 'İstek başarısız');
    } finally {
      setLoading(false);
    }
  };

  if (!permission) {
    return <SafeAreaView style={styles.container}><Text>Kamera izni yükleniyor...</Text></SafeAreaView>;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>İzin Gerekli</Text>
        </View>
        <View style={styles.content}>
          <Text style={{ marginBottom: 20, textAlign: 'center' }}>QR okumak için kameraya erişim izni vermelisiniz.</Text>
          <Button onPress={requestPermission} title="İzin Ver" />
          <View style={{ marginTop: 40, width: '100%' }}>
            <Text style={{ marginBottom: 8, fontWeight: 'bold' }}>Veya Kod Girin:</Text>
            <TextInput
              placeholder="Bilet kodunu girin"
              value={code}
              onChangeText={setCode}
              style={styles.input}
            />
            <TouchableOpacity style={styles.btn} onPress={() => validateManualCode(code)} disabled={loading}>
              <Text style={styles.btnText}>{loading ? 'İşleniyor...' : 'Kodu Doğrula'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>QR / Kod Okuma</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={{ flex: 1, width: '100%' }}>
        <View style={styles.cameraContainer}>
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
          />
          <View style={styles.overlayFrame} />
        </View>

        <Text style={styles.instructionText}>
          QR kodu kare içine tutun.
          {currentEventId ? ` (Etkinlik ID: ${currentEventId})` : ''}
        </Text>

        {scanResult && (
          <View style={[
            styles.resultOverlay,
            { backgroundColor: scanResult.success ? 'rgba(16,185,129,0.95)' : 'rgba(239,68,68,0.95)' }
          ]}>
            <Ionicons
              name={scanResult.success ? "checkmark-circle" : "alert-circle"}
              size={32}
              color="white"
              style={{ marginBottom: 5 }}
            />
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16, textAlign: 'center' }}>
              {scanResult.message}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.manualEntryContainer}>
        <TextInput
          placeholder="Veya bilet kodunu yazın"
          value={code}
          onChangeText={setCode}
          style={styles.input}
          placeholderTextColor="#9ca3af"
        />

        <TouchableOpacity style={styles.btn} onPress={() => validateManualCode(code)} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'İşleniyor...' : 'Kodu Doğrula'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15
  },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1f2937' },
  content: { padding: 20 },
  cameraContainer: {
    height: 360,
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  overlayFrame: {
    ...StyleSheet.absoluteFillObject,
    borderColor: 'rgba(255,255,255,0.3)',
    borderWidth: 2,
    borderRadius: 20,
    margin: 20,
  },
  instructionText: {
    marginTop: 15,
    marginBottom: 5,
    color: '#6b7280',
    textAlign: 'center',
    fontSize: 14
  },
  resultOverlay: {
    position: 'absolute',
    top: 100,
    left: 40,
    right: 40,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    zIndex: 20,
    elevation: 10
  },
  manualEntryContainer: { padding: 20 },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
    fontSize: 16
  },
  btn: {
    backgroundColor: '#4f46e5',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});