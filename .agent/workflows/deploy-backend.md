---
description: Backend deployment to production server
---

# Backend Deployment Workflow

Bu workflow, backend'de (Java Spring Boot) yaptığınız değişiklikleri GitHub'a push edip sunucuda yayınlamak için adım adım rehberdir.

---

## 📋 Proje Yapısı

**Backend Stack:**
- Java 17 + Spring Boot 3.3.5
- PostgreSQL 15 (Veritabanı)
- Maven (Build Tool)
- Docker + Docker Compose (Deployment)

**Ana Dosyalar:**
- `backend/Dockerfile` - Backend için Docker image tanımı
- `docker-compose.yml` - PostgreSQL + Backend orchestration
- `backend/pom.xml` - Maven bağımlılıkları ve build config
- `backend/src/main/resources/application.yml` - Backend konfigürasyonu

---

## 🚀 Deployment Adımları

### 1️⃣ **Yerel Değişiklikleri Test Edin (Opsiyonel ama Önerilen)**

Backend'de değişiklik yaptıysanız, önce yerel olarak test edin:

```bash
# Backend klasörüne gidin
cd backend

# Maven ile build edin
mvn clean package -DskipTests

# Veya Spring Boot'u lokal çalıştırın
mvn spring-boot:run
```

> **Not:** Testleri çalıştırmak isterseniz `-DskipTests` parametresini kaldırın.

---

### 2️⃣ **Git ile Değişiklikleri GitHub'a Push Edin**

```bash
# Proje ana dizinine gidin
cd c:\Users\FUROLOW\Desktop\sifir

# Değişiklikleri kontrol edin
git status

# Tüm değişiklikleri staged hale getirin
git add .

# Commit mesajı yazın (açıklayıcı olsun)
git commit -m "feat: Add new feature X" 
# veya
git commit -m "fix: Fix bug in Y controller"

# GitHub'a push edin (main branch'e)
git push origin main
```

> **Commit Mesaj Önerileri:**
> - `feat: Yeni özellik eklemesi`
> - `fix: Bug düzeltmesi`
> - `refactor: Kod iyileştirmesi`
> - `docs: Dokümantasyon güncellemesi`

---

### 3️⃣ **Sunucuya SSH ile Bağlanın**

```bash
# SSH ile sunucunuza bağlanın
ssh kullanici@SUNUCU_IP_ADRESI

# Örnek:
# ssh ubuntu@45.123.456.78
```

---

### 4️⃣ **Sunucuda Güncellemeleri Çekin**

Sunucuda aşağıdaki komutları çalıştırın:

```bash
# Proje klasörüne gidin (sunucudaki proje yolu)
cd sifir

# Git pull ile değişiklikleri çekin
git pull origin main
```

> **Önemli:** Eğer sunucuda local değişiklikler varsa conflict olabilir. O zaman:
> ```bash
> git stash  # Yerel değişiklikleri geçici sakla
> git pull origin main
> git stash pop  # İsterseniz geri alın
> ```

---

### 5️⃣ **Docker ile Backend'i Yeniden Build ve Deploy Edin**

```bash
# Mevcut container'ları durdurun ve yeniden build edin
docker-compose down
docker-compose up -d --build

# VEYA tek komutla:
docker-compose up -d --build
```

> **Parametreler:**
> - `--build`: Dockerfile'dan yeni image oluşturur (backend kod değişikliklerini dahil eder)
> - `-d`: Container'ları arka planda (detached mode) çalıştırır
> - `down`: Mevcut container'ları durdurur ve siler

---

### 6️⃣ **Logları Kontrol Edin**

Backend'in başarıyla başladığından emin olun:

```bash
# Backend loglarını canlı izleyin
docker-compose logs -f backend

# Veya tüm servislerin loglarını izleyin
docker-compose logs -f

# Son 100 satır log görmek için:
docker-compose logs --tail=100 backend
```

**Başarılı başlatma sinyalleri:**
- ✅ `Started EtuniBackendApplication in X seconds`
- ✅ `Tomcat started on port(s): 8080`
- ✅ `Hibernate: ...` (Veritabanı bağlantısı)

**Hata durumunda:**
- ❌ `Error creating bean...` → Konfigürasyon hatası
- ❌ `Connection refused` → Database bağlantı hatası
- ❌ `Port 8080 already in use` → Port çakışması

---

### 7️⃣ **Servislerin Durumunu Kontrol Edin**

```bash
# Çalışan container'ları listeleyin
docker-compose ps

# Çıktı örneği:
# NAME              STATUS          PORTS
# etuni-backend     Up 30 seconds   0.0.0.0:8080->8080/tcp
# etuni-postgres    Up 35 seconds   0.0.0.0:5432->5432/tcp
```

**Container'lar "Up" durumunda olmalı.** Eğer "Restarting" veya "Exited" görüyorsanız hata var demektir.

---

### 8️⃣ **API'yi Test Edin (İsteğe Bağlı)**

Sunucuda API'nin çalıştığını doğrulayın:

```bash
# Health check endpoint'i test edin
curl http://localhost:8080/actuator/health

# Veya belirli bir endpoint'i test edin
curl http://localhost:8080/api/events
```

---

## 🔄 Hızlı Komut Özeti

**Yerel (Windows PC):**
```bash
cd c:\Users\FUROLOW\Desktop\sifir
git add .
git commit -m "feat: Your change description"
git push origin main
```

**Sunucu (SSH sonrası):**
```bash
cd sifir
git pull origin main
docker-compose up -d --build
docker-compose logs -f backend
```

---

## 🛠️ Sorun Giderme

### Problem: Build başarısız oluyor
**Çözüm:**
```bash
# Maven önbelleğini temizle ve yeniden build et
docker-compose down
docker-compose build --no-cache backend
docker-compose up -d
```

### Problem: Database bağlantı hatası
**Çözüm:**
```bash
# Database container'ını yeniden başlat
docker-compose restart db

# Database loglarını kontrol et
docker-compose logs db
```

### Problem: Port 8080 kullanımda
**Çözüm:**
```bash
# Port kullanan process'i bul
sudo lsof -i :8080

# Veya docker-compose ile temizle
docker-compose down
docker-compose up -d
```

### Problem: Out of Memory hatası
**Çözüm:**
```bash
# Docker system'i temizle
docker system prune -a

# Kullanılmayan image'ları sil
docker image prune -a
```

---

## 📝 Önemli Notlar

1. **Veritabanı Değişiklikleri**: Eğer Entity sınıflarında değişiklik yaptıysanız, Hibernate otomatik olarak şemayı güncelleyecektir (`ddl-auto: update`). Ancak production'da dikkatli olun!

2. **Environment Variables**: `docker-compose.yml` dosyasında tanımlı environment variable'ları değiştirirseniz, container'ı yeniden başlatmanız gerekir.

3. **Güvenlik**: Production'da şunları mutlaka değiştirin:
   - `etuni.jwt.secret` (application.yml)
   - `etuni.qr.secret` (application.yml)
   - `POSTGRES_PASSWORD` (docker-compose.yml)

4. **Backup**: Önemli değişiklikler öncesi veritabanını yedekleyin:
   ```bash
   docker exec etuni-postgres pg_dump -U etuni etuni > backup_$(date +%Y%m%d).sql
   ```

5. **Zero Downtime**: Production'da zero-downtime deployment için blue-green deployment veya rolling update stratejisi kullanın.

---

## 🎯 Sonuç

Bu workflow'u takip ederek backend değişikliklerinizi güvenli bir şekilde sunucuya deploy edebilirsiniz. Her deployment sonrası logları mutlaka kontrol edin ve API testlerini çalıştırın!
