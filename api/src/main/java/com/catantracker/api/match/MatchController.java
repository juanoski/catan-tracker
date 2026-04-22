package com.catantracker.api.match;

import com.catantracker.api.auth.PlayerPrincipal;
import com.catantracker.api.match.dto.CreateMatchRequest;
import com.catantracker.api.match.dto.MatchResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/matches")
@RequiredArgsConstructor
public class MatchController {

    private final MatchService matchService;

    @GetMapping
    public Page<MatchResponse> getAll(@PageableDefault(size = 20, sort = "playedAt") Pageable pageable) {
        return matchService.findAll(pageable);
    }

    @GetMapping("/{id}")
    public MatchResponse getById(@PathVariable UUID id) {
        return matchService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MatchResponse create(@AuthenticationPrincipal PlayerPrincipal principal,
                                @Valid @RequestBody CreateMatchRequest req) {
        return matchService.create(principal.getId(), req);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id,
                                       @AuthenticationPrincipal PlayerPrincipal principal) {
        matchService.delete(id, principal.getId());
        return ResponseEntity.noContent().build();
    }
}
