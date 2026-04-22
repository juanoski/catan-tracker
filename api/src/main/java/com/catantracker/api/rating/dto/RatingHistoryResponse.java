package com.catantracker.api.rating.dto;

import com.catantracker.api.rating.RatingHistory;

import java.time.Instant;
import java.util.UUID;

public record RatingHistoryResponse(
        UUID id,
        UUID matchId,
        int eloBefore,
        int eloAfter,
        int delta,
        Instant recordedAt
) {
    public static RatingHistoryResponse from(RatingHistory r) {
        return new RatingHistoryResponse(r.getId(), r.getMatch().getId(),
                r.getEloBefore(), r.getEloAfter(), r.getDelta(), r.getRecordedAt());
    }
}
