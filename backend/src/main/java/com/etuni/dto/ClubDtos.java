package com.etuni.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class ClubDtos {

    public record ClubRequest(
            @NotNull(message = "Üniversite ID zorunludur") Long universityId,
            @NotBlank(message = "Kulüp adı zorunludur") String name,
            String description) {
    }

    public record ClubResponse(
            Long id,
            Long universityId,
            String universityName,
            String name,
            String description) {
    }
}
