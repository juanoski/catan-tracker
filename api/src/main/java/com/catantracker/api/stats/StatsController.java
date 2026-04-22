package com.catantracker.api.stats;

import com.catantracker.api.stats.dto.PlayerStatsResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/players/{playerId}/stats")
@RequiredArgsConstructor
public class StatsController {

    private final StatsService statsService;

    @GetMapping
    public PlayerStatsResponse getStats(@PathVariable UUID playerId) {
        return statsService.computeStats(playerId);
    }
}
