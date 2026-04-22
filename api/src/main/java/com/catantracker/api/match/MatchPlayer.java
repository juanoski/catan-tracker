package com.catantracker.api.match;

import com.catantracker.api.player.Player;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "match_player",
        uniqueConstraints = @UniqueConstraint(columnNames = {"match_id", "player_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MatchPlayer {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_id", nullable = false)
    private Match match;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_id", nullable = false)
    private Player player;

    @Column(nullable = false, length = 50)
    private String color;

    @Column(nullable = false)
    private int points;

    @Column(nullable = false)
    private boolean winner;

    @Column(name = "longest_road", nullable = false)
    private boolean longestRoad;

    @Column(name = "largest_army", nullable = false)
    private boolean largestArmy;

    @Column(name = "elo_before", nullable = false)
    private int eloBefore;

    @Column(name = "elo_after", nullable = false)
    private int eloAfter;
}
