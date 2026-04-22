package com.catantracker.api.stats.dto;

import java.util.Map;
import java.util.UUID;

public record PlayerStatsResponse(
        UUID playerId,
        String playerName,
        int currentElo,
        int peakElo,
        long totalMatches,
        long totalWins,
        double winRate,
        double avgPoints,
        Map<Integer, Double> winRateByPlayerCount,
        Map<String, Long> matchesByColor,
        Map<String, Long> winsByColor,
        String favoriteColor,
        long longestRoadCount,
        long largestArmyCount,
        int currentWinStreak,
        int longestWinStreak,
        int highestPointsSingleGame,
        HeadToHeadStats nemesis,
        HeadToHeadStats rival
) {
    public record HeadToHeadStats(UUID opponentId, String opponentName, long wins, long losses) {}
}
