package com.catantracker.api.rating;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RatingHistoryRepository extends JpaRepository<RatingHistory, UUID> {
    List<RatingHistory> findByPlayerIdOrderByRecordedAtAsc(UUID playerId);
}
