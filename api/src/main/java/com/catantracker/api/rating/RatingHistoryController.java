package com.catantracker.api.rating;

import com.catantracker.api.rating.dto.RatingHistoryResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/players/{playerId}/ratings")
@RequiredArgsConstructor
public class RatingHistoryController {

    private final RatingHistoryRepository ratingHistoryRepository;

    @GetMapping
    public List<RatingHistoryResponse> getByPlayer(@PathVariable UUID playerId) {
        return ratingHistoryRepository.findByPlayerIdOrderByRecordedAtAsc(playerId)
                .stream().map(RatingHistoryResponse::from).toList();
    }
}
