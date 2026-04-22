package com.catantracker.api.rating;

import com.catantracker.api.match.Match;
import com.catantracker.api.player.Player;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "rating_history")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RatingHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_id", nullable = false)
    private Player player;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_id", nullable = false)
    private Match match;

    @Column(name = "elo_before", nullable = false)
    private int eloBefore;

    @Column(name = "elo_after", nullable = false)
    private int eloAfter;

    @Column(nullable = false)
    private int delta;

    @Column(name = "recorded_at", nullable = false)
    @Builder.Default
    private Instant recordedAt = Instant.now();
}
