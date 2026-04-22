package com.catantracker.api.player;

import com.catantracker.api.auth.PlayerPrincipal;
import com.catantracker.api.player.dto.PlayerResponse;
import com.catantracker.api.player.dto.UpdatePlayerRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/players")
@RequiredArgsConstructor
public class PlayerController {

    private final PlayerService playerService;

    @GetMapping
    public List<PlayerResponse> getAll() {
        return playerService.findAll();
    }

    @GetMapping("/{id}")
    public PlayerResponse getById(@PathVariable UUID id) {
        return playerService.findById(id);
    }

    @PatchMapping("/{id}")
    public PlayerResponse update(@PathVariable UUID id,
                                 @AuthenticationPrincipal PlayerPrincipal principal,
                                 @Valid @RequestBody UpdatePlayerRequest req) {
        return playerService.update(id, principal.getId(), req);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id,
                                       @AuthenticationPrincipal PlayerPrincipal principal) {
        playerService.delete(id, principal.getId());
        return ResponseEntity.noContent().build();
    }
}
