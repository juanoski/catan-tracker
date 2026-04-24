package com.catantracker.api.config;

import com.catantracker.api.player.Player;
import com.catantracker.api.player.PlayerRepository;
import com.catantracker.api.player.PlayerRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.util.StringUtils;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class AdminBootstrap {

    private final PlayerRepository playerRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${bootstrap.admin.name:}")
    private String adminName;

    @Value("${bootstrap.admin.email:}")
    private String adminEmail;

    @Value("${bootstrap.admin.password:}")
    private String adminPassword;

    @Bean
    public ApplicationRunner bootstrapAdminRunner() {
        return args -> {
            if (!StringUtils.hasText(adminName) ||
                !StringUtils.hasText(adminEmail) ||
                !StringUtils.hasText(adminPassword)) {
                log.warn("ADMIN_NAME / ADMIN_EMAIL / ADMIN_PASSWORD were not fully provided, so admin bootstrap was skipped.");
                return;
            }

            String normalizedEmail = adminEmail.trim().toLowerCase();

            Player admin = playerRepository.findByEmail(normalizedEmail)
                    .map(existing -> {
                        existing.setName(adminName.trim());
                        existing.setPasswordHash(passwordEncoder.encode(adminPassword));
                        existing.setRole(PlayerRole.ADMIN);
                        return existing;
                    })
                    .orElseGet(() -> Player.builder()
                            .name(adminName.trim())
                            .email(normalizedEmail)
                            .passwordHash(passwordEncoder.encode(adminPassword))
                            .role(PlayerRole.ADMIN)
                            .build());

            playerRepository.save(admin);
            log.info("Ensured admin account for {}", admin.getEmail());
        };
    }
}
