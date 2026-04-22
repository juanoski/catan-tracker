package com.catantracker.api.expansion.dto;

import com.catantracker.api.expansion.Expansion;

import java.util.UUID;

public record ExpansionResponse(UUID id, String name) {
    public static ExpansionResponse from(Expansion e) {
        return new ExpansionResponse(e.getId(), e.getName());
    }
}
