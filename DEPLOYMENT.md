# ETUNI Deployment Guide (Sunucu Kurulum Rehberi)

Bu rehber, Docker kullanarak ETUNI projesini sunucunuzda nasıl ayağa kaldıracağınızı anlatır.

## 📋 Gereksinimler
- Bir Linux Sunucu (Ubuntu 22.04+ önerilir)
- Sunucuda **Docker** ve **Docker Compose** kurulu olmalıdır.

---

## 🚀 Adım Adım Kurulum

### 1. Dosyaları Sunucuya Taşıyın
Proje klasörünüzü (`sifir` klasörü) sunucuya `git clone` veya `scp` ile gönderin.

```bash
# Örnek (Eğer git kullanıyorsanız):
git clone <your-repo-url>
cd sifir
```

### 2. Docker Compose ile Başlatın
Docker, backend için imajı oluşturacak ve veritabanını otomatik olarak kuracaktır.

```bash
docker-compose up -d --build
```
> [!NOTE]
> `--build` parametresi `backend/Dockerfile` dosyasını kullanarak uygulamanızı paketleyecektir. `-d` ise arka planda çalışmasını sağlar.

### 3. Logları Kontrol Edin
Uygulamanın başarıyla başladığından emin olun:

```bash
docker-compose logs -f backend
```

---

## 📱 Mobil Uygulama Bağlantısı

Mobil uygulamanızın sunucuya bağlanması için şu değişikliği yapın:

1. `mobile/api/authFetch.ts` dosyasını açın.
2. `API_URL` değişkenini sunucu IP adresinizle güncelleyin:

```typescript
// mobile/api/authFetch.ts
export const API_URL = "http://SUNUCU_IP_ADRESINIZ:8080";
```

---

## 🛠️ Önemli Notlar

- **Güvenlik:** `docker-compose.yml` içindeki veritabanı şifrelerini (`etuni_password_change_me`) değiştirmeyi unutmayın.
- **Portlar:** Sunucunuzun firewall ayarlarında 8080 ve 5432 portlarının (gerekliyse) açık olduğundan emin olun.
- **HTTPS:** Gerçek bir prodüksiyon ortamı için Nginx ve SSL (Let's Encrypt) kullanmanız önerilir.
