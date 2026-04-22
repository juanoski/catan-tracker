package com.catantracker.api.achievement.dto;

import com.catantracker.api.achievement.Achievement;

import java.util.UUID;

public record AchievementResponse(
        UUID id,
        String name,
        String description,
        String iconName,
        String category,
        String criteriaType,
        String criteriaValue
) {
    public static AchievementResponse from(Achievement a) {
        return new AchievementResponse(a.getId(), a.getName(), a.getDescription(),
                a.getIconName(), a.getCategory(), a.getCriteriaType(), a.getCriteriaValue());
    }
}
