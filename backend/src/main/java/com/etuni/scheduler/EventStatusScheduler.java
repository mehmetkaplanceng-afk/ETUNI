package com.etuni.scheduler;

import com.etuni.model.Event;
import com.etuni.repository.EventRepository;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class EventStatusScheduler {

    private static final Logger log = LoggerFactory.getLogger(EventStatusScheduler.class);
    private final EventRepository eventRepository;

    public EventStatusScheduler(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    /**
     * Checks for expired events every hour.
     * Events are considered expired if:
     * - eventDate is before today
     * - OR eventDate is today AND startTime is passed
     */
    @Scheduled(cron = "0 0 * * * *") // Runs at minute 0 of every hour
    @Transactional
    public void markExpiredEventsAsPassive() {
        log.info("Checking for expired events...");

        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        List<Event> expiredEvents = eventRepository.findExpiredEvents(today, now, "ACTIVE");

        if (expiredEvents.isEmpty()) {
            log.info("No expired events found.");
            return;
        }

        log.info("Found {} expired events. Updating status to PASSIVE.", expiredEvents.size());

        for (Event event : expiredEvents) {
            event.setStatus("PASSIVE");
            log.info("Marked event {} (ID: {}) as PASSIVE", event.getTitle(), event.getId());
        }

        eventRepository.saveAll(expiredEvents);
        log.info("Successfully updated {} events to PASSIVE.", expiredEvents.size());
    }

    /**
     * Run the check once when the application starts to catch up on any missed
     * updates.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        markExpiredEventsAsPassive();
    }
}
