package com.catantracker.api.player.dto;

import com.catantracker.api.player.PlayerRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AdminCreatePlayerRequest(
        @NotBlank @Size(min = 2, max = 100) String name,
        @NotBlank @Email String email,
        String avatarUrl,
        @NotBlank @Size(min = 8) String password,
        @NotNull PlayerRole role
) {}
