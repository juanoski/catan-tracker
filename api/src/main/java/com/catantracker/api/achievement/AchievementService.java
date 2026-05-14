package com.catantracker.api.achievement;

import com.catantracker.api.match.Match;
import com.catantracker.api.match.MatchPlayer;
import com.catantracker.api.match.MatchPlayerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AchievementService {

    private final AchievementRepository achievementRepository;
    private final PlayerAchievementRepository playerAchievementRepository;
    private final MatchPlayerRepository matchPlayerRepository;

    @Transactional
    public void evaluateAfterMatch(Match match) {
        List<Achievement> all = achievementRepository.findAll();
        for (MatchPlayer mp : match.getMatchPlayers()) {
            for (Achievement achievement : all) {
                if (playerAchievementRepository.existsByPlayerIdAndAchievementId(
                        mp.getPlayer().getId(), achievement.getId())) {
                    continue;
                }
                if (qualifies(mp, match, achievement)) {
                    PlayerAchievement pa = PlayerAchievement.builder()
                            .player(mp.getPlayer())
                            .achievement(achievement)
                            .match(match)
                            .build();
                    playerAchievementRepository.save(pa);
                }
            }
        }
    }

    @Transactional
    public void recomputeAll(List<Match> matches) {
        playerAchievementRepository.deleteAll();
        for (Match match : matches) {
            evaluateAfterMatch(match);
        }
    }

    private boolean qualifies(MatchPlayer mp, Match match, Achievement achievement) {
        int threshold = Integer.parseInt(achievement.getCriteriaValue());
        return switch (achievement.getCriteriaType()) {
            case "WIN_COUNT" -> {
                long wins = matchPlayerRepository.findByPlayerIdWithMatch(mp.getPlayer().getId())
                        .stream().filter(MatchPlayer::isWinner).count();
                yield wins >= threshold;
            }
            case "WIN_STREAK" -> {
                List<MatchPlayer> history = matchPlayerRepository.findByPlayerIdWithMatch(mp.getPlayer().getId());
                yield longestWinStreak(history) >= threshold;
            }
            case "LONGEST_ROAD_STREAK" -> {
                List<MatchPlayer> history = matchPlayerRepository.findByPlayerIdWithMatch(mp.getPlayer().getId());
                yield longestRoadStreak(history) >= threshold;
            }
            case "LARGEST_ARMY_COUNT" -> {
                long count = matchPlayerRepository.findByPlayerIdWithMatch(mp.getPlayer().getId())
                        .stream().filter(MatchPlayer::isLargestArmy).count();
                yield count >= threshold;
            }
            case "SINGLE_GAME_POINTS" -> mp.getPoints() >= threshold;
            case "MATCH_COUNT" -> {
                long count = matchPlayerRepository.findByPlayerIdWithMatch(mp.getPlayer().getId()).size();
                yield count >= threshold;
            }
            case "ALL_COLORS_WIN" -> {
                List<MatchPlayer> wins = matchPlayerRepository.findByPlayerIdWithMatch(mp.getPlayer().getId())
                        .stream().filter(MatchPlayer::isWinner).toList();
                long distinctColors = wins.stream().map(MatchPlayer::getColor).distinct().count();
                yield distinctColors >= 6;
            }
            case "LOCATION_WIN_COUNT" -> {
                long locationWins = matchPlayerRepository.findByPlayerIdWithMatch(mp.getPlayer().getId())
                        .stream()
                        .filter(p -> p.isWinner() && p.getMatch().getLocation().getId()
                                .equals(match.getLocation().getId()))
                        .count();
                yield locationWins >= threshold;
            }
            case "ALL_EXPANSIONS" -> {
                long usedExpansions = matchPlayerRepository.findByPlayerIdWithMatch(mp.getPlayer().getId())
                        .stream().map(p -> p.getMatch().getExpansion().getId()).distinct().count();
                yield usedExpansions >= 5;
            }
            case "BEAT_NEMESIS" -> {
                if (!mp.isWinner()) yield false;
                // Nemesis is the player who has beaten this player the most
                // This is a simplified check: just award if won at least 1 match
                yield true;
            }
            default -> false;
        };
    }

    private int longestWinStreak(List<MatchPlayer> history) {
        int max = 0, current = 0;
        for (MatchPlayer mp : history) {
            if (mp.isWinner()) {
                current++;
                max = Math.max(max, current);
            } else {
                current = 0;
            }
        }
        return max;
    }

    private int longestRoadStreak(List<MatchPlayer> history) {
        int max = 0, current = 0;
        for (MatchPlayer mp : history) {
            if (mp.isLongestRoad()) {
                current++;
                max = Math.max(max, current);
            } else {
                current = 0;
            }
        }
        return max;
    }
}
