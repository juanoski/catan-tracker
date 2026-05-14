package com.catantracker.api.match;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.List;
import java.util.UUID;

public interface MatchRepository extends JpaRepository<Match, UUID> {

    @Query("SELECT m FROM Match m JOIN FETCH m.location JOIN FETCH m.expansion " +
           "JOIN FETCH m.createdBy ORDER BY m.playedAt DESC")
    Page<Match> findAllWithDetails(Pageable pageable);

    @Query("SELECT m FROM Match m JOIN FETCH m.location JOIN FETCH m.expansion " +
           "JOIN FETCH m.createdBy JOIN FETCH m.matchPlayers mp JOIN FETCH mp.player " +
           "WHERE m.id = :id")
    Optional<Match> findByIdWithDetails(@Param("id") UUID id);

    @Query("SELECT DISTINCT m FROM Match m JOIN FETCH m.location JOIN FETCH m.expansion " +
           "JOIN FETCH m.createdBy LEFT JOIN FETCH m.matchPlayers mp LEFT JOIN FETCH mp.player " +
           "ORDER BY m.playedAt ASC, m.createdAt ASC")
    List<Match> findAllWithPlayersOrderByPlayedAtAsc();
}
