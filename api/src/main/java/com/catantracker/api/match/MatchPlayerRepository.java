package com.catantracker.api.match;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface MatchPlayerRepository extends JpaRepository<MatchPlayer, UUID> {

    @Query("SELECT mp FROM MatchPlayer mp JOIN FETCH mp.match WHERE mp.player.id = :playerId " +
           "ORDER BY mp.match.playedAt DESC")
    List<MatchPlayer> findByPlayerIdWithMatch(@Param("playerId") UUID playerId);

    List<MatchPlayer> findByMatchId(UUID matchId);
}
