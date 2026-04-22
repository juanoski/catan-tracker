package com.catantracker.api.match.dto;

import com.catantracker.api.match.Match;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record MatchResponse(
        UUID id,
        UUID locationId,
        String locationName,
        UUID expansionId,
        String expansionName,
        UUID dailyMapId,
        UUID createdById,
        String createdByName,
        LocalDateTime playedAt,
        Integer durationMinutes,
        String deckLayout,
        String notes,
        Instant createdAt,
        List<MatchPlayerResponse> players
) {
    public static MatchResponse from(Match m) {
        return new MatchResponse(
                m.getId(),
                m.getLocation().getId(),
                m.getLocation().getName(),
                m.getExpansion().getId(),
                m.getExpansion().getName(),
                m.getDailyMap() != null ? m.getDailyMap().getId() : null,
                m.getCreatedBy().getId(),
                m.getCreatedBy().getName(),
                m.getPlayedAt(),
                m.getDurationMinutes(),
                m.getDeckLayout(),
                m.getNotes(),
                m.getCreatedAt(),
                m.getMatchPlayers().stream().map(MatchPlayerResponse::from).toList()
        );
    }
}
