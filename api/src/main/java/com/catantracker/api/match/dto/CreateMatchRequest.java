package com.catantracker.api.match.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record CreateMatchRequest(
        @NotNull UUID locationId,
        @NotNull UUID expansionId,
        UUID dailyMapId,
        @NotNull LocalDateTime playedAt,
        @Min(1) @Max(720) Integer durationMinutes,
        @Pattern(regexp = "single|double", message = "Deck layout must be single or double") String deckLayout,
        @Size(max = 1000) String notes,
        @NotNull @Size(min = 2, max = 6) @Valid List<MatchPlayerRequest> players
) {}
