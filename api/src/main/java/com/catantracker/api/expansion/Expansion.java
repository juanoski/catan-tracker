package com.catantracker.api.expansion;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "expansion")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Expansion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;
}
