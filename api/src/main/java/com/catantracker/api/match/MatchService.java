package com.catantracker.api.match;

import com.catantracker.api.achievement.AchievementService;
import com.catantracker.api.dailymap.DailyMapService;
import com.catantracker.api.exception.ApiException;
import com.catantracker.api.expansion.Expansion;
import com.catantracker.api.expansion.ExpansionRepository;
import com.catantracker.api.location.Location;
import com.catantracker.api.location.LocationService;
import com.catantracker.api.match.dto.CreateMatchRequest;
import com.catantracker.api.match.dto.MatchResponse;
import com.catantracker.api.player.Player;
import com.catantracker.api.player.PlayerRepository;
import com.catantracker.api.player.PlayerService;
import com.catantracker.api.rating.RatingHistory;
import com.catantracker.api.rating.RatingHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MatchService {

    private final MatchRepository matchRepository;
    private final MatchPlayerRepository matchPlayerRepository;
    private final PlayerService playerService;
    private final PlayerRepository playerRepository;
    private final LocationService locationService;
    private final ExpansionRepository expansionRepository;
    private final DailyMapService dailyMapService;
    private final RatingHistoryRepository ratingHistoryRepository;
    private final EloService eloService;
    private final AchievementService achievementService;

    public Page<MatchResponse> findAll(Pageable pageable) {
        return matchRepository.findAllWithDetails(pageable).map(MatchResponse::from);
    }

    public MatchResponse findById(UUID id) {
        return matchRepository.findByIdWithDetails(id)
                .map(MatchResponse::from)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Match not found"));
    }

    @Transactional
    public MatchResponse create(UUID requesterId, CreateMatchRequest req) {
        validatePlayers(req);

        Player creator = playerService.getEntityById(requesterId);
        Location location = locationService.getEntityById(req.locationId());
        Expansion expansion = expansionRepository.findById(req.expansionId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Expansion not found"));

        Match match = Match.builder()
                .location(location)
                .expansion(expansion)
                .createdBy(creator)
                .playedAt(req.playedAt())
                .durationMinutes(req.durationMinutes())
                .deckLayout(req.deckLayout() != null ? req.deckLayout() : "single")
                .notes(req.notes())
                .build();

        if (req.dailyMapId() != null) {
            match.setDailyMap(dailyMapService.getEntityById(req.dailyMapId()));
        }

        matchRepository.save(match);

        List<EloService.MatchPlayerInput> eloInputs = req.players().stream()
                .map(p -> {
                    Player player = playerService.getEntityById(p.playerId());
                    return new EloService.MatchPlayerInput(player.getId(), player.getEloRating(), p.winner());
                })
                .toList();

        Map<UUID, Integer> newRatings = eloService.computeNewRatings(eloInputs);

        for (var playerReq : req.players()) {
            Player player = playerService.getEntityById(playerReq.playerId());
            int eloBefore = player.getEloRating();
            int eloAfter = newRatings.get(player.getId());

            MatchPlayer mp = MatchPlayer.builder()
                    .match(match)
                    .player(player)
                    .color(playerReq.color())
                    .points(playerReq.points())
                    .winner(playerReq.winner())
                    .longestRoad(playerReq.longestRoad())
                    .largestArmy(playerReq.largestArmy())
                    .eloBefore(eloBefore)
                    .eloAfter(eloAfter)
                    .build();
            matchPlayerRepository.save(mp);
            match.getMatchPlayers().add(mp);

            player.setEloRating(eloAfter);
            playerRepository.save(player);

            RatingHistory history = RatingHistory.builder()
                    .player(player)
                    .match(match)
                    .eloBefore(eloBefore)
                    .eloAfter(eloAfter)
                    .delta(eloAfter - eloBefore)
                    .recordedAt(Instant.now())
                    .build();
            ratingHistoryRepository.save(history);
        }

        achievementService.evaluateAfterMatch(match);

        return matchRepository.findByIdWithDetails(match.getId())
                .map(MatchResponse::from)
                .orElseThrow();
    }

    @Transactional
    public void delete(UUID id, UUID requesterId) {
        Match match = matchRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Match not found"));
        if (!match.getCreatedBy().getId().equals(requesterId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only the creator can delete this match");
        }
        matchRepository.delete(match);
    }

    private void validatePlayers(CreateMatchRequest req) {
        long winnerCount = req.players().stream().filter(p -> p.winner()).count();
        if (winnerCount != 1) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Exactly one player must be marked as winner");
        }
    }
}
