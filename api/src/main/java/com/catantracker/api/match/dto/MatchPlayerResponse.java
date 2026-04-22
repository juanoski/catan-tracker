package com.catantracker.api.match.dto;

import com.catantracker.api.match.MatchPlayer;

import java.util.UUID;

public record MatchPlayerResponse(
        UUID id,
        UUID playerId,
        String playerName,
        String color,
        int points,
        boolean winner,
        boolean longestRoad,
        boolean largestArmy,
        int eloBefore,
        int eloAfter,
        int eloDelta
) {
    public static MatchPlayerResponse from(MatchPlayer mp) {
        return new MatchPlayerResponse(
                mp.getId(),
                mp.getPlayer().getId(),
                mp.getPlayer().getName(),
                mp.getColor(),
                mp.getPoints(),
                mp.isWinner(),
                mp.isLongestRoad(),
                mp.isLargestArmy(),
                mp.getEloBefore(),
                mp.getEloAfter(),
                mp.getEloAfter() - mp.getEloBefore()
        );
    }
}
