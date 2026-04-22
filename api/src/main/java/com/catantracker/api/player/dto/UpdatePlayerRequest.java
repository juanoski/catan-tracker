package com.catantracker.api.player.dto;

import jakarta.validation.constraints.Size;

public record UpdatePlayerRequest(
        @Size(min = 2, max = 100) String name,
        String avatarUrl
) {}
