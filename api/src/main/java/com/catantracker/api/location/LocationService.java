package com.catantracker.api.location;

import com.catantracker.api.exception.ApiException;
import com.catantracker.api.location.dto.LocationRequest;
import com.catantracker.api.location.dto.LocationResponse;
import com.catantracker.api.player.Player;
import com.catantracker.api.player.PlayerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LocationService {

    private final LocationRepository locationRepository;
    private final PlayerService playerService;

    public List<LocationResponse> findAll() {
        return locationRepository.findAll().stream().map(LocationResponse::from).toList();
    }

    public List<LocationResponse> findByOwner(UUID ownerId) {
        return locationRepository.findByOwnerId(ownerId).stream().map(LocationResponse::from).toList();
    }

    public LocationResponse findById(UUID id) {
        return locationRepository.findById(id)
                .map(LocationResponse::from)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Location not found"));
    }

    public Location getEntityById(UUID id) {
        return locationRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Location not found"));
    }

    @Transactional
    public LocationResponse create(UUID ownerId, LocationRequest req) {
        Player owner = playerService.getEntityById(ownerId);
        Location location = Location.builder()
                .owner(owner)
                .name(req.name())
                .address(req.address())
                .build();
        return LocationResponse.from(locationRepository.save(location));
    }

    @Transactional
    public LocationResponse update(UUID id, UUID requesterId, LocationRequest req) {
        Location location = getEntityById(id);
        if (!location.getOwner().getId().equals(requesterId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only the owner can update this location");
        }
        location.setName(req.name());
        location.setAddress(req.address());
        return LocationResponse.from(locationRepository.save(location));
    }

    @Transactional
    public void delete(UUID id, UUID requesterId) {
        Location location = getEntityById(id);
        if (!location.getOwner().getId().equals(requesterId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only the owner can delete this location");
        }
        locationRepository.delete(location);
    }
}
