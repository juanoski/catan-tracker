package com.catantracker.api.player.dto;

import com.catantracker.api.player.PlayerRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record AdminUpdatePlayerRequest(
        @Size(min = 2, max = 100) String name,
        @Email String email,
        String avatarUrl,
        @Size(min = 8) String password,
        PlayerRole role
) {}
