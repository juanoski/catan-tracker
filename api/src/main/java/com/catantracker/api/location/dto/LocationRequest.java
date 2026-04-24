package com.catantracker.api.location.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record LocationRequest(
        UUID ownerId,
        @NotBlank @Size(min = 2, max = 100) String name,
        String address
) {}
