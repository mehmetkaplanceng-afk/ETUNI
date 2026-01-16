package com.etuni.controller;

import com.etuni.dto.AuthDtos.ApiResponse;
import com.etuni.service.RecommendationService;
import com.etuni.service.RecommendationService.ScoredEvent;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/recommendations")
public class RecommendationController {

  private final RecommendationService recommendationService;

  public RecommendationController(RecommendationService recommendationService) {
    this.recommendationService = recommendationService;
  }

  @GetMapping
  public ApiResponse<List<ScoredEvent>> recommend(Authentication auth) {
    Long userId = Long.valueOf(auth.getPrincipal().toString());
    return ApiResponse.ok("OK", recommendationService.recommend(userId));
  }

  @GetMapping("/{userId}")
  public ApiResponse<List<ScoredEvent>> recommendForUser(@PathVariable("userId") Long userId) {
    return ApiResponse.ok("OK", recommendationService.recommend(userId));
  }
}
