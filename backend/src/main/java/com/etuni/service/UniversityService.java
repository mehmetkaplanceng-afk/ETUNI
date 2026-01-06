package com.etuni.service;

import com.etuni.dto.UniversityDtos.*;
import com.etuni.model.University;
import com.etuni.repository.UniversityRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class UniversityService {

    private final UniversityRepository universityRepo;

    public UniversityService(UniversityRepository universityRepo) {
        this.universityRepo = universityRepo;
    }

    public UniversityResponse create(UniversityRequest req) {
        University uni = new University();
        uni.setName(req.name());
        uni.setCity(req.city());
        uni.setLogoUrl(req.logoUrl());
        return toDto(universityRepo.save(uni));
    }

    public UniversityResponse update(Long id, UniversityRequest req) {
        University uni = universityRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("UNIVERSITY_NOT_FOUND"));
        uni.setName(req.name());
        uni.setCity(req.city());
        uni.setLogoUrl(req.logoUrl());
        return toDto(universityRepo.save(uni));
    }

    public List<UniversityResponse> list() {
        return universityRepo.findAll().stream().map(this::toDto).toList();
    }

    public UniversityResponse get(Long id) {
        return toDto(universityRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("UNIVERSITY_NOT_FOUND")));
    }

    private UniversityResponse toDto(University u) {
        return new UniversityResponse(u.getId(), u.getName(), u.getCity(), u.getLogoUrl());
    }
}
