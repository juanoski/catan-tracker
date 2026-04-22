package com.catantracker.api.location.dto;

import com.catantracker.api.location.Location;

import java.util.UUID;

public record LocationResponse(
        UUID id,
        UUID ownerId,
        String ownerName,
        String name,
        String address
) {
    public static LocationResponse from(Location l) {
        return new LocationResponse(l.getId(), l.getOwner().getId(),
                l.getOwner().getName(), l.getName(), l.getAddress());
    }
}
