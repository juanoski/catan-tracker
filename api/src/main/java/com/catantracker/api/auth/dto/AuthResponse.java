package com.catantracker.api.auth.dto;

import com.catantracker.api.player.PlayerRole;

import java.util.UUID;

public record AuthResponse(
        String token,
        UUID playerId,
        String name,
        String email,
        PlayerRole role
) {}
