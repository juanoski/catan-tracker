package com.catantracker.api.player.dto;

import com.catantracker.api.player.Player;
import com.catantracker.api.player.PlayerRole;

import java.time.Instant;
import java.util.UUID;

public record PlayerResponse(
        UUID id,
        String name,
        String email,
        String avatarUrl,
        PlayerRole role,
        int eloRating,
        Instant createdAt
) {
    public static PlayerResponse from(Player p) {
        return new PlayerResponse(p.getId(), p.getName(), p.getEmail(),
                p.getAvatarUrl(), p.getRole(), p.getEloRating(), p.getCreatedAt());
    }
}
