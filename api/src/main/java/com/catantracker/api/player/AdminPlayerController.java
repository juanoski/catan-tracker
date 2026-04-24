package com.catantracker.api.player;

import com.catantracker.api.auth.PlayerPrincipal;
import com.catantracker.api.player.dto.AdminCreatePlayerRequest;
import com.catantracker.api.player.dto.AdminUpdatePlayerRequest;
import com.catantracker.api.player.dto.PlayerResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/players")
@RequiredArgsConstructor
public class AdminPlayerController {

    private final PlayerService playerService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PlayerResponse create(@Valid @RequestBody AdminCreatePlayerRequest req) {
        return playerService.createByAdmin(req);
    }

    @PatchMapping("/{id}")
    public PlayerResponse update(@PathVariable UUID id,
                                 @AuthenticationPrincipal PlayerPrincipal principal,
                                 @Valid @RequestBody AdminUpdatePlayerRequest req) {
        return playerService.updateByAdmin(id, principal.getId(), req);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id,
                                       @AuthenticationPrincipal PlayerPrincipal principal) {
        playerService.deleteByAdmin(id, principal.getId());
        return ResponseEntity.noContent().build();
    }
}
