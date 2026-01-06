package com.etuni.util;

import com.etuni.model.Club;
import com.etuni.model.Event;
import com.etuni.model.PromotionRequest;
import com.etuni.model.University;
import com.etuni.model.UserEntity;
import com.etuni.repository.ClubRepository;
import com.etuni.repository.EventRepository;
import com.etuni.repository.UniversityRepository;
import com.etuni.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.etuni.service.RecommendationService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.InputStream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.Random;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UniversityRepository universityRepository;
    private final EventRepository eventRepository;
    private final ClubRepository clubRepository;
    private final UserRepository userRepository;
    private final com.etuni.repository.PromotionRequestRepository requestRepo;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    public DataSeeder(UniversityRepository universityRepository,
            EventRepository eventRepository,
            ClubRepository clubRepository,
            UserRepository userRepository,
            com.etuni.repository.PromotionRequestRepository requestRepo,
            PasswordEncoder passwordEncoder,
            ObjectMapper objectMapper,
            org.springframework.jdbc.core.JdbcTemplate jdbcTemplate) {
        this.universityRepository = universityRepository;
        this.eventRepository = eventRepository;
        this.clubRepository = clubRepository;
        this.userRepository = userRepository;
        this.requestRepo = requestRepo;
        this.passwordEncoder = passwordEncoder;
        this.objectMapper = objectMapper;
        this.jdbcTemplate = jdbcTemplate;
    }

    private static final Logger logger = LoggerFactory.getLogger(DataSeeder.class);

    @Override
    public void run(String... args) throws Exception {
        try {
            jdbcTemplate
                    .execute("ALTER TABLE attendance ADD COLUMN IF NOT EXISTS status VARCHAR(255) DEFAULT 'PENDING'");
            logger.debug("Schema updated: status column added to attendance table.");
        } catch (Exception e) {
            logger.debug("Schema update skipped or failed: {}", e.getMessage());
        }
        try {
            jdbcTemplate
                    .execute("ALTER TABLE attendance ADD COLUMN IF NOT EXISTS ticket_code VARCHAR(255)");
            logger.debug("Schema updated: ticket_code column added to attendance table.");
        } catch (Exception e) {
            logger.debug("Schema update skipped or failed (ticket_code): {}", e.getMessage());
        }

        seedUniversities(); // Universities and sample events first
        seedUsers(); // Then users (so they can link to uni)

        // Add sample promotion request for testing
        UserEntity student = userRepository.findByEmail("student@etuni.com").orElse(null);
        if (student != null && ((List<PromotionRequest>) requestRepo.findByUserId(student.getId())).isEmpty()) {
            PromotionRequest req = new PromotionRequest();
            req.setUser(student);
            req.setUniversity(student.getUniversity());
            req.setStatus("PENDING");
            requestRepo.save(req);
            logger.info("Sample promotion request created for student@etuni.com");
        }
    }

    private void seedUniversities() throws Exception {
        if (universityRepository.count() > 0) {
            logger.info("Veritabanı zaten dolu, seeding atlanıyor.");
            return;
        }

        logger.debug("Üniversiteler yükleniyor...");
        ClassPathResource resource = new ClassPathResource("turkey_universities_list.json");
        if (!resource.exists()) {
            logger.warn("Hata: turkey_universities_list.json dosyası bulunamadı.");
            return;
        }

        try (InputStream is = resource.getInputStream()) {
            List<Map<String, Object>> uniList = objectMapper.readValue(is, new com.fasterxml.jackson.core.type.TypeReference<List<Map<String, Object>>>() {
            });

            for (Map<String, Object> data : uniList) {
                University uni = new University();
                uni.setName((String) data.get("Adı"));
                uni.setCity((String) data.get("İli"));
                universityRepository.save(uni);
            }

            logger.info("{} üniversite eklendi.", uniList.size());

            // Adıyaman için örnek veriler
            University adiyamanUni = universityRepository.findAll().stream()
                    .filter(u -> u.getName().contains("Adıyaman"))
                    .findFirst()
                    .orElse(null);

            if (adiyamanUni != null) {
                logger.info("Adıyaman Üniversitesi bulundu, 50 örnek etkinlik oluşturuluyor...");

                Club defaultClub = new Club();
                defaultClub.setName("Adıyaman Kültür ve Sanat Kulübü");
                defaultClub.setUniversity(adiyamanUni);
                defaultClub.setDescription("Örnek etkinlik kulübü");
                clubRepository.save(defaultClub);

                String[] titles = { "Robotik Yarışması", "Şiir Dinletisi", "Kariyer Günleri", "Yapay Zeka Konferansı",
                        "Tiyatro Gösterisi", "Girişimcilik Zirvesi", "Konser", "Spor Festivali" };
                String[] types = { "KONFERANS", "WORKSHOP", "FESTİVAL", "SEMİNER" };
                String[] categories = { "Teknoloji", "Sanat", "Kariyer", "Sosyal" };
                Random random = new Random();

                for (int i = 1; i <= 50; i++) {
                    Event e = new Event();
                    e.setUniversity(adiyamanUni);
                    e.setClub(defaultClub);
                    e.setTitle(titles[random.nextInt(titles.length)] + " #" + i);
                    e.setDescription("Adıyaman'da gerçekleştirilecek olan muhteşem bir etkinlik. Herkesi bekliyoruz!");
                    e.setEventType(types[random.nextInt(types.length)]);
                    e.setCategory(categories[random.nextInt(categories.length)]);
                    e.setTargetAudience("Tüm Öğrenciler");
                    e.setEventDate(LocalDate.now().plusDays(random.nextInt(30)));
                    e.setStartTime(LocalTime.of(random.nextInt(8) + 10, 0));
                    e.setStatus("ACTIVE");
                    e.setQrPayload("E" + i + "-" + System.currentTimeMillis());
                    eventRepository.save(e);
                }
                logger.info("50 etkinlik oluşturuldu.");
            }
            return;
        }
    }

    private void seedUsers() {
        University adiyamanUni = universityRepository.findAll().stream()
                .filter(u -> u.getName().contains("Adıyaman"))
                .findFirst()
                .orElse(null);

        createUserIfNotFound("admin@etuni.com", "Admin User", "admin123", "ADMIN", null);
        createUserIfNotFound("organizer@etuni.com", "Sample Organizer", "organizer123", "ORGANIZER", adiyamanUni);
        createUserIfNotFound("rep@etuni.com", "University Rep", "rep123", "UNIVERSITY_STAFF", adiyamanUni);
        createUserIfNotFound("student@etuni.com", "Sample Student", "student123", "STUDENT", adiyamanUni);
    }

    private void createUserIfNotFound(String email, String name, String pass, String role, University uni) {
        var existing = userRepository.findByEmail(email);
        if (existing.isEmpty()) {
            UserEntity user = new UserEntity();
            user.setEmail(email);
            user.setFullName(name);
            user.setPasswordHash(passwordEncoder.encode(pass));
            user.setRole(role);
            user.setStatus("ACTIVE");
            user.setUniversity(uni);
            userRepository.save(user);
            System.out.println("User created: " + email + " with role: " + role);
        } else if (uni != null && existing.get().getUniversity() == null) {
            UserEntity user = existing.get();
            user.setUniversity(uni);
            userRepository.save(user);
            System.out.println("User university updated: " + email);
        }
    }
}
