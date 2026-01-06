package com.etuni.controller;

import com.etuni.dto.AuthDtos.ApiResponse;
import com.etuni.dto.UniversityDtos.*;
import com.etuni.service.UniversityService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/universities")
public class UniversityController {

    private final UniversityService universityService;

    public UniversityController(UniversityService universityService) {
        this.universityService = universityService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<UniversityResponse> create(@Valid @RequestBody UniversityRequest req) {
        return ApiResponse.ok("UNIVERSITY_CREATED", universityService.create(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','UNIVERSITY_STAFF')")
    public ApiResponse<UniversityResponse> update(@PathVariable Long id, @Valid @RequestBody UniversityRequest req) {
        return ApiResponse.ok("UNIVERSITY_UPDATED", universityService.update(id, req));
    }

    @GetMapping
    public ApiResponse<List<UniversityResponse>> list() {
        return ApiResponse.ok("OK", universityService.list());
    }

    @GetMapping("/{id}")
    public ApiResponse<UniversityResponse> get(@PathVariable Long id) {
        return ApiResponse.ok("OK", universityService.get(id));
    }
}
