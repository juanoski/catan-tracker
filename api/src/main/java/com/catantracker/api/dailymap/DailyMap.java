package com.catantracker.api.dailymap;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "daily_map")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DailyMap {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "map_date", nullable = false, unique = true)
    private LocalDate mapDate;

    @Column(nullable = false, length = 100)
    private String seed;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "tile_config", nullable = false, columnDefinition = "jsonb")
    private String tileConfig;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "number_config", nullable = false, columnDefinition = "jsonb")
    private String numberConfig;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "port_config", nullable = false, columnDefinition = "jsonb")
    private String portConfig;
}
