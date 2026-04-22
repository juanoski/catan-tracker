package com.catantracker.api.stats;

import com.catantracker.api.exception.ApiException;
import com.catantracker.api.match.Match;
import com.catantracker.api.match.MatchPlayer;
import com.catantracker.api.match.MatchPlayerRepository;
import com.catantracker.api.player.Player;
import com.catantracker.api.player.PlayerService;
import com.catantracker.api.rating.RatingHistoryRepository;
import com.catantracker.api.stats.dto.PlayerStatsResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StatsService {

    private final MatchPlayerRepository matchPlayerRepository;
    private final RatingHistoryRepository ratingHistoryRepository;
    private final PlayerService playerService;

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public PlayerStatsResponse computeStats(UUID playerId) {
        Player player = playerService.getEntityById(playerId);
        List<MatchPlayer> history = matchPlayerRepository.findByPlayerIdWithMatch(playerId);

        if (history.isEmpty()) {
            return emptyStats(player);
        }

        long totalMatches = history.size();
        long totalWins = history.stream().filter(MatchPlayer::isWinner).count();
        double winRate = totalMatches > 0 ? (double) totalWins / totalMatches : 0.0;
        double avgPoints = history.stream().mapToInt(MatchPlayer::getPoints).average().orElse(0.0);

        int peakElo = ratingHistoryRepository.findByPlayerIdOrderByRecordedAtAsc(playerId)
                .stream().mapToInt(r -> r.getEloAfter()).max().orElse(player.getEloRating());

        Map<Integer, Double> winRateByPlayerCount = history.stream()
                .collect(Collectors.groupingBy(
                        mp -> mp.getMatch().getMatchPlayers().size(),
                        Collectors.collectingAndThen(
                                Collectors.toList(),
                                list -> list.stream().filter(MatchPlayer::isWinner).count() / (double) list.size()
                        )
                ));

        Map<String, Long> matchesByColor = history.stream()
                .collect(Collectors.groupingBy(MatchPlayer::getColor, Collectors.counting()));
        Map<String, Long> winsByColor = history.stream()
                .filter(MatchPlayer::isWinner)
                .collect(Collectors.groupingBy(MatchPlayer::getColor, Collectors.counting()));

        String favoriteColor = matchesByColor.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);

        long longestRoadCount = history.stream().filter(MatchPlayer::isLongestRoad).count();
        long largestArmyCount = history.stream().filter(MatchPlayer::isLargestArmy).count();
        int highestPoints = history.stream().mapToInt(MatchPlayer::getPoints).max().orElse(0);

        int[] streaks = computeStreaks(history);

        PlayerStatsResponse.HeadToHeadStats nemesis = computeNemesis(playerId, history);
        PlayerStatsResponse.HeadToHeadStats rival = computeRival(playerId, history);

        return new PlayerStatsResponse(
                player.getId(), player.getName(), player.getEloRating(), peakElo,
                totalMatches, totalWins, winRate, avgPoints,
                winRateByPlayerCount, matchesByColor, winsByColor, favoriteColor,
                longestRoadCount, largestArmyCount,
                streaks[0], streaks[1],
                highestPoints, nemesis, rival
        );
    }

    private int[] computeStreaks(List<MatchPlayer> history) {
        int current = 0, longest = 0;
        for (MatchPlayer mp : history) {
            if (mp.isWinner()) {
                current++;
                longest = Math.max(longest, current);
            } else {
                current = 0;
            }
        }
        return new int[]{current, longest};
    }

    private PlayerStatsResponse.HeadToHeadStats computeNemesis(UUID playerId, List<MatchPlayer> history) {
        Map<UUID, long[]> h2h = buildH2H(playerId, history);
        return h2h.entrySet().stream()
                .filter(e -> e.getValue()[1] > 0)
                .max(Comparator.comparingLong(e -> e.getValue()[1]))
                .map(e -> {
                    try {
                        Player opp = playerService.getEntityById(e.getKey());
                        return new PlayerStatsResponse.HeadToHeadStats(
                                opp.getId(), opp.getName(), e.getValue()[0], e.getValue()[1]);
                    } catch (Exception ex) {
                        return null;
                    }
                })
                .orElse(null);
    }

    private PlayerStatsResponse.HeadToHeadStats computeRival(UUID playerId, List<MatchPlayer> history) {
        Map<UUID, long[]> h2h = buildH2H(playerId, history);
        return h2h.entrySet().stream()
                .filter(e -> e.getValue()[0] > 0)
                .max(Comparator.comparingLong(e -> e.getValue()[0]))
                .map(e -> {
                    try {
                        Player opp = playerService.getEntityById(e.getKey());
                        return new PlayerStatsResponse.HeadToHeadStats(
                                opp.getId(), opp.getName(), e.getValue()[0], e.getValue()[1]);
                    } catch (Exception ex) {
                        return null;
                    }
                })
                .orElse(null);
    }

    /**
     * Returns a map of opponentId -> [winsAgainstOpponent, lossesAgainstOpponent]
     */
    private Map<UUID, long[]> buildH2H(UUID playerId, List<MatchPlayer> history) {
        Map<UUID, long[]> h2h = new HashMap<>();
        for (MatchPlayer mp : history) {
            Match match = mp.getMatch();
            for (MatchPlayer other : match.getMatchPlayers()) {
                if (other.getPlayer().getId().equals(playerId)) continue;
                UUID oppId = other.getPlayer().getId();
                h2h.putIfAbsent(oppId, new long[]{0, 0});
                if (mp.isWinner()) {
                    h2h.get(oppId)[0]++;
                } else if (other.isWinner()) {
                    h2h.get(oppId)[1]++;
                }
            }
        }
        return h2h;
    }

    private PlayerStatsResponse emptyStats(Player player) {
        return new PlayerStatsResponse(
                player.getId(), player.getName(), player.getEloRating(), player.getEloRating(),
                0, 0, 0.0, 0.0, Map.of(), Map.of(), Map.of(), null,
                0, 0, 0, 0, 0, null, null);
    }
}
