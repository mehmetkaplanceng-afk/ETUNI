# 🗺️ ETUNI Sunucu Kurulum Yol Haritası (Roadmap)

Bu dosya, projenizi sıfırdan bir sunucuya (VPS) taşımak için ihtiyacınız olan tüm teknik adımları içerir.

---

## 1. Aşama: Sunucu (VPS) Seçimi
Projenizin (Java Spring + Postgres) sağlıklı çalışması için minimum **2 GB RAM** ve **2 CPU** olan bir sunucu önerilir.

**Popüler Sağlayıcılar:**
- **Hetzner/DigitalOcean/Vultr:** Fiyat/performans olarak en iyileridir.
- **AWS/Google Cloud/Azure:** Daha karmaşıktır ama ölçeklenebilirdir.
- **İşletim Sistemi:** Mutlaka **Ubuntu 22.04 LTS** veya **24.04 LTS** seçin.

---

## 2. Aşama: Sunucuya Bağlantı ve Güncelleme
Sunucunuzu satın aldıktan sonra terminalden (veya PowerShell) bağlanın:

```bash
# Sunucuya bağlanın
ssh root@SUNUCU_IP_ADRESI

# Paket listesini güncelleyin
apt update && apt upgrade -y
```

---

## 3. Aşama: Docker ve Docker Compose Kurulumu
Docker, bir "eklenti" değil, sistemi kaplar içine alan bir motor yazılımdır. Sunucuya şu resmi komutlarla kurun:

```bash
# Gerekli araçları kurun
apt install apt-transport-https ca-certificates curl software-properties-common -y

# Docker GPG anahtarını ekleyin
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Repository'i ekleyin
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Docker'ı kurun
apt update
apt install docker-ce docker-ce-cli containerd.io docker-compose-plugin -y
```

---

## 4. Aşama: Proje Dosyalarını Sunucuya Aktarma
Bilgisayarınızdaki `sifir` klasörünü sunucuya göndermek için iki yolunuz var:

**Seçenek A: Git (Önerilen)**
- Projeyi GitHub/GitLab'a yükleyin.
- Sunucuda `git clone https://github.com/kullanici/proje.git` komutuyla çekin.

**Seçenek B: SCP (Direkt Gönderim)**
Yerel terminalinizden (sunucuya bağlı olmadığınız) şu komutu çalıştırın:
```bash
scp -r C:\Users\FUROLOW\Desktop\sifir root@SUNUCU_IP_ADRESI:/root/
```

---

## 5. Aşama: Uygulamayı Başlatma
Sunucuda proje klasörüne girin ve Docker'ı ateşleyin:

```bash
cd /root/sifir
docker compose up -d --build
```

---

## 6. Aşama: Kontrol ve Test
- **Log Takibi:** `docker compose logs -f backend`
- **Konteyner Listesi:** `docker ps` (Hem `etuni-backend` hem `etuni-postgres` çalışıyor olmalı)
- **Erişim:** Tarayıcıdan `http://SUNUCU_IP:8080/swagger-ui.html` adresine girerek test edin.

---

## 7. Aşama (İleri Seviye): Alan Adı (Domain) ve HTTPS
Eğer `https://api.etuni.com` gibi profesyonel bir adres istiyorsanız:
1. **Nginx** kurun (`apt install nginx`).
2. **Certbot** ile ücretsiz SSL (HTTPS) alın.
3. Nginx'i 8080 portuna yönlendirin (Reverse Proxy).

> [!TIP]
> **Docker Eklentisi Hakkında:** Eğer VS Code kullanıyorsanız, sunucuya **"Remote - SSH"** eklentisi ile bağlanıp, oradan Docker eklentisini sunucu içindeki konteynerleri yönetmek için kullanabilirsiniz. Bu, terminale dokunmadan görsel olarak yönetmenizi sağlar.
