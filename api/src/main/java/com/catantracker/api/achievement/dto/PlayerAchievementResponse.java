package com.catantracker.api.achievement.dto;

import com.catantracker.api.achievement.PlayerAchievement;

import java.time.Instant;
import java.util.UUID;

public record PlayerAchievementResponse(
        UUID id,
        UUID achievementId,
        String name,
        String description,
        String iconName,
        String category,
        UUID matchId,
        Instant unlockedAt
) {
    public static PlayerAchievementResponse from(PlayerAchievement pa) {
        return new PlayerAchievementResponse(
                pa.getId(),
                pa.getAchievement().getId(),
                pa.getAchievement().getName(),
                pa.getAchievement().getDescription(),
                pa.getAchievement().getIconName(),
                pa.getAchievement().getCategory(),
                pa.getMatch() != null ? pa.getMatch().getId() : null,
                pa.getUnlockedAt()
        );
    }
}
