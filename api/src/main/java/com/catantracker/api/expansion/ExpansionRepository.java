package com.catantracker.api.expansion;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ExpansionRepository extends JpaRepository<Expansion, UUID> {
}
