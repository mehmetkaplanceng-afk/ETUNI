package com.etuni.controller;

import com.etuni.dto.AuthDtos.ApiResponse;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/health")
public class HealthController {
  @GetMapping
  public ApiResponse<String> ok() {
    return ApiResponse.ok("OK", "UP");
  }
}
