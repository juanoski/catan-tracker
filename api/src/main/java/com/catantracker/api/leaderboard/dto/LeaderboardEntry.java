package com.catantracker.api.leaderboard.dto;

import java.util.UUID;

public record LeaderboardEntry(
        int rank,
        UUID playerId,
        String playerName,
        String avatarUrl,
        int eloRating,
        long matchesPlayed,
        long wins
) {}
