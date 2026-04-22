package com.catantracker.api.achievement;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "achievement")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Achievement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(nullable = false)
    private String description;

    @Column(name = "icon_name", nullable = false, length = 100)
    private String iconName;

    @Column(nullable = false, length = 50)
    private String category;

    @Column(name = "criteria_type", nullable = false, length = 100)
    private String criteriaType;

    @Column(name = "criteria_value", nullable = false, length = 255)
    private String criteriaValue;
}
