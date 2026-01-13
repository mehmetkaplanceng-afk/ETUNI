package com.etuni.controller;

import com.etuni.dto.AuthDtos.ApiResponse;
import com.etuni.dto.ClubDtos.*;
import com.etuni.service.ClubService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/clubs")
public class ClubController {

    private final ClubService clubService;

    public ClubController(ClubService clubService) {
        this.clubService = clubService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','UNIVERSITY_STAFF','ORGANIZER')")
    public ApiResponse<ClubResponse> create(@Valid @RequestBody ClubRequest req) {
        return ApiResponse.ok("CLUB_CREATED", clubService.create(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','UNIVERSITY_STAFF','ORGANIZER')")
    public ApiResponse<ClubResponse> update(@PathVariable("id") Long id, @Valid @RequestBody ClubRequest req) {
        return ApiResponse.ok("CLUB_UPDATED", clubService.update(id, req));
    }

    @GetMapping("/university/{universityId}")
    public ApiResponse<List<ClubResponse>> listByUniversity(@PathVariable("universityId") Long universityId) {
        return ApiResponse.ok("OK", clubService.listByUniversity(universityId));
    }

    @GetMapping("/{id}")
    public ApiResponse<ClubResponse> get(@PathVariable("id") Long id) {
        return ApiResponse.ok("OK", clubService.get(id));
    }
}
