package com.catantracker.api.achievement;

import com.catantracker.api.match.Match;
import com.catantracker.api.player.Player;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "player_achievement",
        uniqueConstraints = @UniqueConstraint(columnNames = {"player_id", "achievement_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PlayerAchievement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_id", nullable = false)
    private Player player;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "achievement_id", nullable = false)
    private Achievement achievement;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_id")
    private Match match;

    @Column(name = "unlocked_at", nullable = false)
    @Builder.Default
    private Instant unlockedAt = Instant.now();
}
