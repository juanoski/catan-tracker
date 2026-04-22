package com.catantracker.api.achievement;

import com.catantracker.api.achievement.dto.AchievementResponse;
import com.catantracker.api.achievement.dto.PlayerAchievementResponse;
import com.catantracker.api.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class AchievementController {

    private final AchievementRepository achievementRepository;
    private final PlayerAchievementRepository playerAchievementRepository;

    @GetMapping("/api/achievements")
    public List<AchievementResponse> getAll() {
        return achievementRepository.findAll().stream().map(AchievementResponse::from).toList();
    }

    @GetMapping("/api/achievements/{id}")
    public AchievementResponse getById(@PathVariable UUID id) {
        return achievementRepository.findById(id)
                .map(AchievementResponse::from)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Achievement not found"));
    }

    @GetMapping("/api/players/{playerId}/achievements")
    public List<PlayerAchievementResponse> getByPlayer(@PathVariable UUID playerId) {
        return playerAchievementRepository.findByPlayerIdWithAchievement(playerId)
                .stream().map(PlayerAchievementResponse::from).toList();
    }
}
