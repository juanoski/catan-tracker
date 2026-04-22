package com.catantracker.api.location;

import com.catantracker.api.auth.PlayerPrincipal;
import com.catantracker.api.location.dto.LocationRequest;
import com.catantracker.api.location.dto.LocationResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/locations")
@RequiredArgsConstructor
public class LocationController {

    private final LocationService locationService;

    @GetMapping
    public List<LocationResponse> getAll() {
        return locationService.findAll();
    }

    @GetMapping("/{id}")
    public LocationResponse getById(@PathVariable UUID id) {
        return locationService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LocationResponse create(@AuthenticationPrincipal PlayerPrincipal principal,
                                   @Valid @RequestBody LocationRequest req) {
        return locationService.create(principal.getId(), req);
    }

    @PatchMapping("/{id}")
    public LocationResponse update(@PathVariable UUID id,
                                   @AuthenticationPrincipal PlayerPrincipal principal,
                                   @Valid @RequestBody LocationRequest req) {
        return locationService.update(id, principal.getId(), req);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id,
                                       @AuthenticationPrincipal PlayerPrincipal principal) {
        locationService.delete(id, principal.getId());
        return ResponseEntity.noContent().build();
    }
}
