package com.catantracker.api.match;

import com.catantracker.api.dailymap.DailyMap;
import com.catantracker.api.expansion.Expansion;
import com.catantracker.api.location.Location;
import com.catantracker.api.player.Player;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "match")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Match {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id", nullable = false)
    private Location location;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expansion_id", nullable = false)
    private Expansion expansion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "daily_map_id")
    private DailyMap dailyMap;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private Player createdBy;

    @Column(name = "played_at", nullable = false)
    private LocalDateTime playedAt;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "deck_layout", nullable = false, length = 20)
    @Builder.Default
    private String deckLayout = "single";

    @Column
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @OneToMany(mappedBy = "match", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<MatchPlayer> matchPlayers = new ArrayList<>();
}
