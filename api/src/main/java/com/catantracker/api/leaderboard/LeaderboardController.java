package com.catantracker.api.leaderboard;

import com.catantracker.api.leaderboard.dto.LeaderboardEntry;
import com.catantracker.api.match.MatchPlayerRepository;
import com.catantracker.api.player.Player;
import com.catantracker.api.player.PlayerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

@RestController
@RequestMapping("/api/leaderboard")
@RequiredArgsConstructor
public class LeaderboardController {

    private final PlayerRepository playerRepository;
    private final MatchPlayerRepository matchPlayerRepository;

    @GetMapping
    public List<LeaderboardEntry> getLeaderboard() {
        List<Player> players = playerRepository.findAll().stream()
                .sorted((a, b) -> Integer.compare(b.getEloRating(), a.getEloRating()))
                .toList();

        AtomicInteger rank = new AtomicInteger(1);
        return players.stream().map(p -> {
            var history = matchPlayerRepository.findByPlayerIdWithMatch(p.getId());
            long wins = history.stream().filter(mp -> mp.isWinner()).count();
            return new LeaderboardEntry(
                    rank.getAndIncrement(),
                    p.getId(), p.getName(), p.getAvatarUrl(),
                    p.getEloRating(), history.size(), wins);
        }).toList();
    }
}
