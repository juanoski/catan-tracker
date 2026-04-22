package com.catantracker.api.match.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record CreateMatchRequest(
        @NotNull UUID locationId,
        @NotNull UUID expansionId,
        UUID dailyMapId,
        @NotNull LocalDateTime playedAt,
        Integer durationMinutes,
        String deckLayout,
        String notes,
        @NotNull @Size(min = 2, max = 6) @Valid List<MatchPlayerRequest> players
) {}
