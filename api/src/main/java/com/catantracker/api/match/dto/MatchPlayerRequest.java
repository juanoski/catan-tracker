package com.catantracker.api.match.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record MatchPlayerRequest(
        @NotNull UUID playerId,
        @NotBlank String color,
        @Min(0) @Max(20) int points,
        boolean winner,
        boolean longestRoad,
        boolean largestArmy
) {}
