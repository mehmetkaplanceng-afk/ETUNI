# ETUNI - Akıllı Etkinlik Yönetimi ve Katılım Analiz Platformu

<p align="center">
  <img src="https://img.shields.io/badge/Spring%20Boot-3.3.5-brightgreen" alt="Spring Boot">
  <img src="https://img.shields.io/badge/React%20Native-Expo-blue" alt="React Native">
  <img src="https://img.shields.io/badge/PostgreSQL-Database-blue" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/License-MIT-yellow" alt="License">
</p>

## 🎯 Proje Hakkında

ETUNI, üniversite etkinliklerini yönetmek, takip etmek ve analiz etmek için geliştirilmiş akıllı bir platformdur.

### ✨ Özellikler

- 📅 **Etkinlik Yönetimi** - Oluşturma, düzenleme, iptal
- 📊 **Açıklanabilir Öneri Sistemi** - 5 faktörlü akıllı puanlama
- 📈 **Analytics Dashboard** - Etkinlik, üniversite, kulüp raporları
- 🤖 **AI Chatbot** - Etkinlik sorgulama asistanı
- 📱 **QR Katılım** - Mobil QR kod ile check-in
- 👥 **Rol Bazlı Erişim** - Student, Organizer, Staff, Admin
- 🔔 **Bildirimler** - E-posta ve push notifications
- 🌙 **Dark/Light Theme** - Tema desteği

## 🚀 Hızlı Başlangıç

### Gereksinimler

- Java 17+
- Maven 3.8+
- PostgreSQL 14+
- Node.js 18+ (mobil için)

### Backend Kurulumu

```bash
# Repoyu klonlayın
git clone https://github.com/YOUR_USERNAME/etuni.git
cd etuni/backend

# PostgreSQL veritabanı oluşturun
createdb etuni

# Uygulamayı başlatın
mvn spring-boot:run
```

Backend `http://localhost:8080` adresinde çalışacaktır.

### Mobil Kurulumu

```bash
cd mobile
npm install
npx expo start
```

## 📁 Proje Yapısı

```
etuni/
├── backend/                 # Spring Boot API
│   ├── src/main/java/
│   │   └── com/etuni/
│   │       ├── config/      # Güvenlik, cache, rate limiting
│   │       ├── controller/  # REST API endpoints
│   │       ├── dto/         # Data transfer objects
│   │       ├── exception/   # Custom exceptions
│   │       ├── model/       # JPA entities
│   │       ├── repository/  # Database repositories
│   │       ├── service/     # Business logic
│   │       └── util/        # Utilities
│   └── src/main/resources/
│       ├── templates/       # Thymeleaf templates
│       └── static/          # CSS, JS assets
├── mobile/                  # React Native / Expo
│   ├── app/                 # Screen components
│   ├── components/          # Reusable components
│   └── api/                 # API client
└── docker-compose.yml       # Docker orchestration
```

## 🔧 Konfigürasyon

`backend/src/main/resources/application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/etuni
    username: your_username
    password: your_password
  mail:
    host: smtp.gmail.com
    port: 587
    username: your_email@gmail.com
    password: your_app_password

etuni:
  jwt:
    secret: "your-secret-key-min-32-chars"
```

## 📖 API Dokümantasyonu

Swagger UI: `http://localhost:8080/swagger-ui.html`

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

MIT License - detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 📞 İletişim

- GitHub Issues: Bug raporları ve özellik istekleri için
