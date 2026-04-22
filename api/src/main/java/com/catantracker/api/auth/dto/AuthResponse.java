package com.catantracker.api.auth.dto;

import java.util.UUID;

public record AuthResponse(
        String token,
        UUID playerId,
        String name,
        String email
) {}
