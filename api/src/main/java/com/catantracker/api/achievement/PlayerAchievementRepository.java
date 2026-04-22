package com.catantracker.api.achievement;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

public interface PlayerAchievementRepository extends JpaRepository<PlayerAchievement, UUID> {

    List<PlayerAchievement> findByPlayerIdOrderByUnlockedAtDesc(UUID playerId);

    boolean existsByPlayerIdAndAchievementId(UUID playerId, UUID achievementId);

    @Query("SELECT pa.achievement.criteriaType FROM PlayerAchievement pa WHERE pa.player.id = :playerId")
    Set<String> findUnlockedCriteriaTypesByPlayerId(@Param("playerId") UUID playerId);

    @Query("SELECT pa FROM PlayerAchievement pa JOIN FETCH pa.achievement WHERE pa.player.id = :playerId")
    List<PlayerAchievement> findByPlayerIdWithAchievement(@Param("playerId") UUID playerId);

    Optional<PlayerAchievement> findByPlayerIdAndAchievementId(UUID playerId, UUID achievementId);
}
