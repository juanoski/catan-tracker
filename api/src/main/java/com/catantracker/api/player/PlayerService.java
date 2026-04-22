package com.catantracker.api.player;

import com.catantracker.api.exception.ApiException;
import com.catantracker.api.player.dto.PlayerResponse;
import com.catantracker.api.player.dto.UpdatePlayerRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PlayerService {

    private final PlayerRepository playerRepository;

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
    public void delete(UUID id, UUID requesterId) {
        Player player = getEntityById(id);
        if (!player.getId().equals(requesterId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Cannot delete another player's profile");
        }
        playerRepository.delete(player);
    }
}
