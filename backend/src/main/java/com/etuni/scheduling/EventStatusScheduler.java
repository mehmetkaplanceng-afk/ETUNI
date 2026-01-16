package com.etuni.scheduling;

import com.etuni.model.Event;
import com.etuni.repository.EventRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Component
public class EventStatusScheduler {

    private static final Logger log = LoggerFactory.getLogger(EventStatusScheduler.class);
    private final EventRepository eventRepo;

    public EventStatusScheduler(EventRepository eventRepo) {
        this.eventRepo = eventRepo;
    }

    @Scheduled(cron = "0 0 * * * *") // Run every hour
    @Transactional
    public void expirePastEvents() {
        log.info("Checking for expired events...");

        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        // Find ACTIVE events that are in the past
        // Logic: Event Date < Today OR (Event Date == Today AND Start Time < Now)
        List<Event> expiredEvents = eventRepo.findExpiredEvents(today, now, "ACTIVE");

        for (Event event : expiredEvents) {
            event.setStatus("PASSIVE");
            log.info("Event expired: {} (ID: {})", event.getTitle(), event.getId());
        }

        if (!expiredEvents.isEmpty()) {
            eventRepo.saveAll(expiredEvents);
            log.info("{} events marked as PASSIVE.", expiredEvents.size());
        }
    }
}
