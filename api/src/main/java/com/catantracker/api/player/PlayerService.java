package com.catantracker.api.player;

import com.catantracker.api.exception.ApiException;
import com.catantracker.api.player.dto.AdminCreatePlayerRequest;
import com.catantracker.api.player.dto.AdminUpdatePlayerRequest;
import com.catantracker.api.player.dto.PlayerResponse;
import com.catantracker.api.player.dto.UpdatePlayerRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PlayerService {

    private final PlayerRepository playerRepository;
    private final PasswordEncoder passwordEncoder;

    public List<PlayerResponse> findAll() {
        return playerRepository.findAll().stream().map(PlayerResponse::from).toList();
    }

    public PlayerResponse findById(UUID id) {
        return playerRepository.findById(id)
                .map(PlayerResponse::from)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Player not found"));
    }

    public Player getEntityById(UUID id) {
        return playerRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Player not found"));
    }

    @Transactional
    public PlayerResponse createByAdmin(AdminCreatePlayerRequest req) {
        if (playerRepository.existsByEmail(req.email())) {
            throw new ApiException(HttpStatus.CONFLICT, "Email already registered");
        }

        Player player = Player.builder()
                .name(req.name())
                .email(req.email().trim().toLowerCase())
                .avatarUrl(req.avatarUrl())
                .passwordHash(passwordEncoder.encode(req.password()))
                .role(req.role())
                .build();

        return PlayerResponse.from(playerRepository.save(player));
    }

    @Transactional
    public PlayerResponse update(UUID id, UUID requesterId, UpdatePlayerRequest req) {
        Player player = getEntityById(id);
        if (!player.getId().equals(requesterId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Cannot update another player's profile");
        }
        if (req.name() != null) player.setName(req.name());
        if (req.avatarUrl() != null) player.setAvatarUrl(req.avatarUrl());
        return PlayerResponse.from(playerRepository.save(player));
    }

    @Transactional
    public PlayerResponse updateByAdmin(UUID id, UUID requesterId, AdminUpdatePlayerRequest req) {
        Player target = getEntityById(id);
        Player requester = getEntityById(requesterId);

        if (req.email() != null && playerRepository.existsByEmailAndIdNot(req.email().trim().toLowerCase(), id)) {
            throw new ApiException(HttpStatus.CONFLICT, "Email already registered");
        }

        if (target.getId().equals(requesterId) && req.role() == PlayerRole.PLAYER && requester.getRole() == PlayerRole.ADMIN) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Admins cannot demote themselves");
        }

        if (req.name() != null) target.setName(req.name());
        if (req.email() != null) target.setEmail(req.email().trim().toLowerCase());
        if (req.avatarUrl() != null) target.setAvatarUrl(req.avatarUrl());
        if (req.password() != null && !req.password().isBlank()) {
            target.setPasswordHash(passwordEncoder.encode(req.password()));
        }
        if (req.role() != null) target.setRole(req.role());

        return PlayerResponse.from(playerRepository.save(target));
    }

    @Transactional
    public void delete(UUID id, UUID requesterId) {
        Player player = getEntityById(id);
        if (!player.getId().equals(requesterId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Cannot delete another player's profile");
        }
        playerRepository.delete(player);
    }

    @Transactional
    public void deleteByAdmin(UUID id, UUID requesterId) {
        if (id.equals(requesterId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Admins cannot delete themselves");
        }
        Player player = getEntityById(id);
        playerRepository.delete(player);
    }
}
