package com.etuni.controller;

import com.etuni.dto.AuthDtos.ApiResponse;
import com.etuni.service.EventQueryBotService;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bot")
public class EventQueryBotController {

  private final EventQueryBotService bot;

  public EventQueryBotController(EventQueryBotService bot) {
    this.bot = bot;
  }

  public record BotRequest(@NotNull Long userId, @NotBlank String question) {}

  @PostMapping("/ask")
  public ApiResponse<String> ask(@RequestBody BotRequest req) {
    return ApiResponse.ok("OK", bot.answer(req.userId(), req.question()));
  }
}
