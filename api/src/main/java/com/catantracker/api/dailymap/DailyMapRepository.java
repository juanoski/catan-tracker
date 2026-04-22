package com.catantracker.api.dailymap;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

public interface DailyMapRepository extends JpaRepository<DailyMap, UUID> {
    Optional<DailyMap> findByMapDate(LocalDate date);
}
