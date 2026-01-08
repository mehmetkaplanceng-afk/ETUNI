package com.etuni.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

public class EventDtos {

        public record EventRequest(
                        @NotNull(message = "Üniversite seçilmelidir") Long universityId,

                        Long clubId,

                        @NotBlank(message = "Etkinlik başlığı boş olamaz") @Size(min = 3, max = 200, message = "Başlık 3-200 karakter arasında olmalıdır") String title,

                        @Size(max = 5000, message = "Açıklama en fazla 5000 karakter olabilir") String description,

                        @NotBlank(message = "Etkinlik türü seçilmelidir") String eventType,

                        String category,

                        String targetAudience,

                        @NotNull(message = "Etkinlik tarihi belirtilmelidir") @FutureOrPresent(message = "Etkinlik tarihi geçmiş bir tarih olamaz") LocalDate eventDate,

                        @NotNull(message = "Başlangıç saati belirtilmelidir") LocalTime startTime,

                        String location,
                        Double latitude,
                        Double longitude,

                        BigDecimal price) {
        }

        public record EventUpdateRequest(
                        @Size(min = 3, max = 200, message = "Başlık 3-200 karakter arasında olmalıdır") String title,

                        @Size(max = 5000, message = "Açıklama en fazla 5000 karakter olabilir") String description,

                        String eventType,
                        String category,
                        String targetAudience,

                        @FutureOrPresent(message = "Etkinlik tarihi geçmiş bir tarih olamaz") LocalDate eventDate,

                        LocalTime startTime,

                        @Pattern(regexp = "^(ACTIVE|CANCELLED|DRAFT)$", message = "Geçersiz durum değeri") String status,

                        String location,
                        Double latitude,
                        Double longitude,

                        BigDecimal price) {
        }

        public record EventResponse(
                        Long id,
                        Long universityId,
                        Long clubId,
                        String title,
                        String description,
                        String eventType,
                        String category,
                        String targetAudience,
                        LocalDate eventDate,
                        LocalTime startTime,
                        String status,
                        String location,
                        Double latitude,
                        Double longitude,
                        BigDecimal price) {
        }
}
