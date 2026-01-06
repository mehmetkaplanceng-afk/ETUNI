package com.etuni.service;

import com.etuni.dto.ClubDtos.*;
import com.etuni.model.Club;
import com.etuni.model.University;
import com.etuni.repository.ClubRepository;
import com.etuni.repository.UniversityRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ClubService {

    private final ClubRepository clubRepo;
    private final UniversityRepository universityRepo;

    public ClubService(ClubRepository clubRepo, UniversityRepository universityRepo) {
        this.clubRepo = clubRepo;
        this.universityRepo = universityRepo;
    }

    public ClubResponse create(ClubRequest req) {
        University uni = universityRepo.findById(req.universityId())
                .orElseThrow(() -> new RuntimeException("UNIVERSITY_NOT_FOUND"));

        Club club = new Club();
        club.setUniversity(uni);
        club.setName(req.name());
        club.setDescription(req.description());
        return toDto(clubRepo.save(club));
    }

    public ClubResponse update(Long id, ClubRequest req) {
        Club club = clubRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("CLUB_NOT_FOUND"));

        if (!club.getUniversity().getId().equals(req.universityId())) {
            University uni = universityRepo.findById(req.universityId())
                    .orElseThrow(() -> new RuntimeException("UNIVERSITY_NOT_FOUND"));
            club.setUniversity(uni);
        }

        club.setName(req.name());
        club.setDescription(req.description());
        return toDto(clubRepo.save(club));
    }

    public List<ClubResponse> listByUniversity(Long universityId) {
        return clubRepo.findByUniversityId(universityId).stream().map(this::toDto).toList();
    }

    public ClubResponse get(Long id) {
        return toDto(clubRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("CLUB_NOT_FOUND")));
    }

    private ClubResponse toDto(Club c) {
        String uniName = c.getUniversity() != null ? c.getUniversity().getName() : null;
        return new ClubResponse(c.getId(), c.getUniversity().getId(), uniName, c.getName(), c.getDescription());
    }
}
