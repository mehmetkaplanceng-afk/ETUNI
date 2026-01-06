package com.etuni.dto;

import jakarta.validation.constraints.NotBlank;

public class UniversityDtos {

    public record UniversityRequest(
            @NotBlank(message = "Üniversite adı zorunludur") String name,
            String city,
            String logoUrl) {
    }

    public record UniversityResponse(
            Long id,
            String name,
            String city,
            String logoUrl) {
    }
}
