package com.catantracker.api.dailymap.dto;

import com.catantracker.api.dailymap.DailyMap;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.LocalDate;
import java.util.UUID;

public record DailyMapResponse(
        UUID id,
        LocalDate mapDate,
        String seed,
        Object tileConfig,
        Object numberConfig,
        Object portConfig
) {
    public static DailyMapResponse from(DailyMap m, ObjectMapper mapper) {
        try {
            return new DailyMapResponse(
                    m.getId(), m.getMapDate(), m.getSeed(),
                    mapper.readValue(m.getTileConfig(), Object.class),
                    mapper.readValue(m.getNumberConfig(), Object.class),
                    mapper.readValue(m.getPortConfig(), Object.class)
            );
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to deserialize map config", e);
        }
    }
}
