package com.catantracker.api.match;

import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class EloService {

    private static final int K = 32;

    /**
     * Computes new ELO ratings for all players after a multiplayer match.
     *
     * Algorithm: pairwise comparison between all players.
     * - Winner scores 1 against every other player.
     * - Each loser scores 0 against the winner, and 0.5 against other losers.
     * - Each player's delta is the sum of all pairwise deltas divided by (N-1) to normalize.
     *
     * Returns a map of playerId -> new ELO rating.
     */
    public Map<UUID, Integer> computeNewRatings(List<MatchPlayerInput> players) {
        int n = players.size();
        Map<UUID, Double> totalDeltas = new HashMap<>();
        for (MatchPlayerInput p : players) {
            totalDeltas.put(p.playerId(), 0.0);
        }

        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                MatchPlayerInput a = players.get(i);
                MatchPlayerInput b = players.get(j);

                double actualA = actualScore(a, b);
                double actualB = 1.0 - actualA;

                double expectedA = expectedScore(a.eloRating(), b.eloRating());
                double expectedB = 1.0 - expectedA;

                totalDeltas.merge(a.playerId(), K * (actualA - expectedA), Double::sum);
                totalDeltas.merge(b.playerId(), K * (actualB - expectedB), Double::sum);
            }
        }

        Map<UUID, Integer> newRatings = new HashMap<>();
        for (MatchPlayerInput p : players) {
            double normalizedDelta = totalDeltas.get(p.playerId()) / (n - 1);
            int newRating = Math.max(1, (int) Math.round(p.eloRating() + normalizedDelta));
            newRatings.put(p.playerId(), newRating);
        }
        return newRatings;
    }

    private double expectedScore(int ratingA, int ratingB) {
        return 1.0 / (1.0 + Math.pow(10, (ratingB - ratingA) / 400.0));
    }

    private double actualScore(MatchPlayerInput a, MatchPlayerInput b) {
        if (a.winner()) return 1.0;
        if (b.winner()) return 0.0;
        return 0.5; // both are losers → draw between them
    }

    public record MatchPlayerInput(UUID playerId, int eloRating, boolean winner) {}
}
