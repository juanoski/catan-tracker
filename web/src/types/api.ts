export type PlayerRole = "ADMIN" | "PLAYER";

export interface AuthResponse {
  token: string;
  playerId: string;
  name: string;
  email: string;
  role: PlayerRole;
}

export interface Player {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: PlayerRole;
  eloRating: number;
  createdAt: string;
}

export interface Location {
  id: string;
  ownerId: string;
  ownerName: string;
  name: string;
  address: string | null;
}

export interface Expansion {
  id: string;
  name: string;
}

export interface MatchPlayerResponse {
  id: string;
  playerId: string;
  playerName: string;
  color: string;
  points: number;
  winner: boolean;
  longestRoad: boolean;
  largestArmy: boolean;
  eloBefore: number;
  eloAfter: number;
  eloDelta: number;
}

export interface Match {
  id: string;
  locationId: string;
  locationName: string;
  expansionId: string;
  expansionName: string;
  dailyMapId: string | null;
  createdById: string;
  createdByName: string;
  playedAt: string;
  durationMinutes: number | null;
  deckLayout: string;
  notes: string | null;
  createdAt: string;
  players: MatchPlayerResponse[];
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  playerName: string;
  avatarUrl: string | null;
  eloRating: number;
  matchesPlayed: number;
  wins: number;
}

export interface RatingHistoryEntry {
  id: string;
  matchId: string;
  eloBefore: number;
  eloAfter: number;
  delta: number;
  recordedAt: string;
}

export interface PlayerAchievement {
  id: string;
  achievementId: string;
  name: string;
  description: string;
  iconName: string;
  category: string;
  matchId: string | null;
  unlockedAt: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  iconName: string;
  category: string;
  criteriaType: string;
  criteriaValue: string;
}

export interface PlayerStats {
  playerId: string;
  playerName: string;
  currentElo: number;
  peakElo: number;
  totalMatches: number;
  totalWins: number;
  winRate: number;
  avgPoints: number;
  winRateByPlayerCount: Record<string, number>;
  matchesByColor: Record<string, number>;
  winsByColor: Record<string, number>;
  favoriteColor: string | null;
  longestRoadCount: number;
  largestArmyCount: number;
  currentWinStreak: number;
  longestWinStreak: number;
  highestPointsSingleGame: number;
  nemesis: HeadToHead | null;
  rival: HeadToHead | null;
}

export interface HeadToHead {
  opponentId: string;
  opponentName: string;
  wins: number;
  losses: number;
}

export interface AdminCreatePlayerRequest {
  name: string;
  email: string;
  avatarUrl?: string;
  password: string;
  role: PlayerRole;
}

export interface AdminUpdatePlayerRequest {
  name?: string;
  email?: string;
  avatarUrl?: string;
  password?: string;
  role?: PlayerRole;
}

export interface CreateMatchRequest {
  locationId: string;
  expansionId: string;
  dailyMapId?: string;
  playedAt: string;
  durationMinutes?: number;
  deckLayout: string;
  notes?: string;
  players: CreateMatchPlayerRequest[];
}

export interface CreateMatchPlayerRequest {
  playerId: string;
  color: string;
  points: number;
  winner: boolean;
  longestRoad: boolean;
  largestArmy: boolean;
}
