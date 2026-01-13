package com.etuni.config;

import com.etuni.model.Club;
import com.etuni.model.Event;
import com.etuni.model.University;
import com.etuni.repository.ClubRepository;
import com.etuni.repository.EventRepository;
import com.etuni.repository.UniversityRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ClubDataInitializer {

    private static final Logger log = LoggerFactory.getLogger(ClubDataInitializer.class);

    private final ClubRepository clubRepository;
    private final UniversityRepository universityRepository;
    private final EventRepository eventRepository;

    public ClubDataInitializer(ClubRepository clubRepository,
            UniversityRepository universityRepository,
            EventRepository eventRepository) {
        this.clubRepository = clubRepository;
        this.universityRepository = universityRepository;
        this.eventRepository = eventRepository;
    }

    @PostConstruct
    public void initializeClubsForAdiyaman() {
        // Adıyaman University ID
        final Long ADIYAMAN_UNIVERSITY_ID = 4L;

        University adiyamanUni = universityRepository.findById(ADIYAMAN_UNIVERSITY_ID).orElse(null);
        if (adiyamanUni == null) {
            log.warn("Adıyaman Üniversitesi (ID: {}) bulunamadı. Kulüp verisi oluşturulamadı.", ADIYAMAN_UNIVERSITY_ID);
            return;
        }

        // Check if clubs already exist
        List<Club> existingClubs = clubRepository.findByUniversityId(ADIYAMAN_UNIVERSITY_ID);
        if (!existingClubs.isEmpty()) {
            log.info("Adıyaman Üniversitesi için {} kulüp zaten mevcut. Yeni kulüp oluşturulmadı.",
                    existingClubs.size());

            // Still assign first club to events without club
            assignFirstClubToExistingEvents(adiyamanUni, existingClubs.get(0));
            return;
        }

        log.info("Adıyaman Üniversitesi için 5 kulüp oluşturuluyor...");

        // Create 5 clubs
        Club club1 = createClub(adiyamanUni, "Bilgisayar Kulübü",
                "Yazılım, yapay zeka ve teknoloji alanında etkinlikler düzenleyen kulüp");
        Club club2 = createClub(adiyamanUni, "Müzik Kulübü",
                "Müzik dinletileri, konserler ve müzik workshopları organize eden kulüp");
        Club club3 = createClub(adiyamanUni, "Spor Kulübü",
                "Spor etkinlikleri, turnuvalar ve sağlıklı yaşam faaliyetleri düzenleyen kulüp");
        Club club4 = createClub(adiyamanUni, "Sanat ve Kültür Kulübü",
                "Sergiler, tiyatro gösterileri ve kültürel etkinlikler organize eden kulüp");
        Club club5 = createClub(adiyamanUni, "Kariyer ve Girişimcilik Kulübü",
                "Kariyer seminerleri, girişimcilik atölyeleri ve networking etkinlikleri düzenleyen kulüp");

        clubRepository.save(club1);
        clubRepository.save(club2);
        clubRepository.save(club3);
        clubRepository.save(club4);
        clubRepository.save(club5);

        log.info("✅ 5 kulüp başarıyla oluşturuldu!");

        // Assign first club (Bilgisayar Kulübü) to existing events
        assignFirstClubToExistingEvents(adiyamanUni, club1);
    }

    private Club createClub(University university, String name, String description) {
        Club club = new Club();
        club.setUniversity(university);
        club.setName(name);
        club.setDescription(description);
        return club;
    }

    private void assignFirstClubToExistingEvents(University university, Club defaultClub) {
        List<Event> eventsWithoutClub = eventRepository.findByUniversityId(university.getId())
                .stream()
                .filter(e -> e.getClub() == null)
                .toList();

        if (eventsWithoutClub.isEmpty()) {
            log.info("Adıyaman Üniversitesi'ne ait kulübü olmayan etkinlik bulunamadı.");
            return;
        }

        log.info("Adıyaman Üniversitesi'ne ait {} etkinliğe default kulüp ({}) atanıyor...",
                eventsWithoutClub.size(), defaultClub.getName());

        for (Event event : eventsWithoutClub) {
            event.setClub(defaultClub);
        }

        eventRepository.saveAll(eventsWithoutClub);
        log.info("✅ {} etkinliğe '{}' kulübü atandı!", eventsWithoutClub.size(), defaultClub.getName());
    }
}
