import React, { useEffect, useMemo, useState } from 'react';
import {
  Sun,
  Moon,
  Trophy,
  Users,
  Filter,
  User,
  House,
  Route,
  Shield,
  Sparkles,
  Clock3,
  Download,
  Upload,
  Settings2,
  Map as MapIcon,
  Plus,
  Pencil,
  Trash2,
  BarChart3,
} from 'lucide-react';

const STORAGE_KEY = 'catan-lite-manager-v3';

const DEFAULT_COLORS = [
  { name: 'Red', hex: '#ef4444' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'White', hex: '#ffffff' },
  { name: 'Orange', hex: '#fb923c' },
  { name: 'Purple', hex: '#a855f7' },
  { name: 'Teal', hex: '#14b8a6' },
];

const DEFAULT_EXPANSIONS = ['Base Game', 'Seafarers', 'Cities & Knights', 'Traders & Barbarians'];
const DEFAULT_LOCATIONS = ['Home', "Mora's", "Tomi's", 'Beach', 'Cabin'];
const DEFAULT_PLAYERS = [{ name: 'Juani' }, { name: 'Mora' }, { name: 'Tomi' }, { name: 'Nati' }];
const DEFAULT_FILTERS = { expansion: 'all', playerCount: 'all', host: 'all', location: 'all', dateFrom: '', dateTo: '' };

const SEED_MATCHES = [
  {
    id: 1,
    date: '2026-04-10',
    winner: 'Juani',
    location: 'Home',
    host: 'Juani',
    expansionsUsed: ['Base Game'],
    timerMinutes: 72,
    players: [
      { name: 'Juani', color: 'Red', toasted: true, longestRoad: 7, knightsUsed: 2, injuries: 1 },
      { name: 'Mora', color: 'Blue', toasted: false, longestRoad: 5, knightsUsed: 1, injuries: 2 },
      { name: 'Tomi', color: 'White', toasted: true, longestRoad: 4, knightsUsed: 0, injuries: 3 },
      { name: 'Nati', color: 'Orange', toasted: false, longestRoad: 3, knightsUsed: 1, injuries: 1 },
    ],
  },
  {
    id: 2,
    date: '2026-04-12',
    winner: 'Mora',
    location: "Mora's",
    host: 'Mora',
    expansionsUsed: ['Base Game', 'Seafarers'],
    timerMinutes: 95,
    players: [
      { name: 'Juani', color: 'White', toasted: false, longestRoad: 5, knightsUsed: 1, injuries: 2 },
      { name: 'Mora', color: 'Red', toasted: true, longestRoad: 8, knightsUsed: 3, injuries: 1 },
      { name: 'Tomi', color: 'Orange', toasted: true, longestRoad: 4, knightsUsed: 2, injuries: 4 },
      { name: 'Nati', color: 'Blue', toasted: false, longestRoad: 6, knightsUsed: 1, injuries: 2 },
    ],
  },
  {
    id: 3,
    date: '2026-04-19',
    winner: 'Juani',
    location: 'Home',
    host: 'Juani',
    expansionsUsed: ['Base Game', 'Cities & Knights'],
    timerMinutes: 110,
    players: [
      { name: 'Juani', color: 'Blue', toasted: true, longestRoad: 9, knightsUsed: 4, injuries: 0 },
      { name: 'Mora', color: 'Orange', toasted: false, longestRoad: 5, knightsUsed: 2, injuries: 1 },
      { name: 'Tomi', color: 'Red', toasted: true, longestRoad: 4, knightsUsed: 1, injuries: 2 },
      { name: 'Nati', color: 'White', toasted: true, longestRoad: 6, knightsUsed: 2, injuries: 3 },
    ],
  },
  {
    id: 4,
    date: '2026-04-20',
    winner: 'Juani',
    location: 'Cabin',
    host: 'Tomi',
    expansionsUsed: ['Base Game', 'Traders & Barbarians'],
    timerMinutes: 88,
    players: [
      { name: 'Juani', color: 'Orange', toasted: false, longestRoad: 8, knightsUsed: 2, injuries: 1 },
      { name: 'Mora', color: 'Blue', toasted: true, longestRoad: 5, knightsUsed: 2, injuries: 4 },
      { name: 'Tomi', color: 'White', toasted: false, longestRoad: 7, knightsUsed: 1, injuries: 2 },
      { name: 'Nati', color: 'Red', toasted: false, longestRoad: 4, knightsUsed: 0, injuries: 1 },
    ],
  },
];

const MAP_PRESETS = {
  'Base Game': {
    terrainPool: ['Wood', 'Wood', 'Wood', 'Wood', 'Wheat', 'Wheat', 'Wheat', 'Wheat', 'Sheep', 'Sheep', 'Sheep', 'Sheep', 'Brick', 'Brick', 'Brick', 'Ore', 'Ore', 'Ore', 'Desert'],
    numberPool: [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12],
  },
  Seafarers: {
    terrainPool: ['Wood', 'Wood', 'Wood', 'Wheat', 'Wheat', 'Wheat', 'Sheep', 'Sheep', 'Sheep', 'Sheep', 'Brick', 'Brick', 'Brick', 'Ore', 'Ore', 'Ore', 'Gold', 'Gold', 'Desert'],
    numberPool: [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12],
  },
  'Cities & Knights': {
    terrainPool: ['Wood', 'Wood', 'Wood', 'Wood', 'Wheat', 'Wheat', 'Wheat', 'Wheat', 'Sheep', 'Sheep', 'Sheep', 'Sheep', 'Brick', 'Brick', 'Brick', 'Ore', 'Ore', 'Ore', 'Desert'],
    numberPool: [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12],
  },
  'Traders & Barbarians': {
    terrainPool: ['Wood', 'Wood', 'Wood', 'Wood', 'Wheat', 'Wheat', 'Wheat', 'Wheat', 'Sheep', 'Sheep', 'Sheep', 'Sheep', 'Brick', 'Brick', 'Brick', 'Ore', 'Ore', 'Ore', 'Desert'],
    numberPool: [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12],
  },
};

const BOARD_ROWS = [3, 4, 5, 4, 3];
const BOARD_STARTS = [0, 3, 7, 12, 16];

function uniqueStrings(values) {
  return [...new Set(values.filter(Boolean).map((value) => String(value).trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function normalizePlayersDirectory(directory, fallbackNames = []) {
  const map = new Map();
  const add = (entry) => {
    const name = typeof entry === 'string' ? entry.trim() : String(entry?.name || '').trim();
    if (!name) return;
    const key = name.toLowerCase();
    if (!map.has(key)) map.set(key, { name });
  };
  (Array.isArray(directory) ? directory : []).forEach(add);
  fallbackNames.forEach((name) => add({ name }));
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function getPlayerNames(directory) {
  return normalizePlayersDirectory(directory).map((player) => player.name);
}

function colorByName(name, colors) {
  return colors.find((color) => color.name === name) || colors[0];
}

function safeColorName(name, colors, fallbackIndex = 0) {
  return colors.some((color) => color.name === name) ? name : colors[fallbackIndex % colors.length]?.name || colors[0]?.name || 'Red';
}

function normalizeColorOptions(colors) {
  const result = [];
  const seen = new Set();
  (Array.isArray(colors) ? colors : []).forEach((entry, index) => {
    const name = String(entry?.name || `Color ${index + 1}`).trim();
    const hex = /^#([0-9A-F]{3}|[0-9A-F]{6})$/i.test(String(entry?.hex || '').trim()) ? String(entry.hex).trim() : DEFAULT_COLORS[index % DEFAULT_COLORS.length].hex;
    if (!name || seen.has(name.toLowerCase())) return;
    seen.add(name.toLowerCase());
    result.push({ name, hex });
  });
  return result.length ? result : DEFAULT_COLORS;
}

function normalizePlayerEntry(player, colors, fallbackIndex = 0) {
  return {
    name: String(player?.name || '').trim(),
    color: safeColorName(String(player?.color || ''), colors, fallbackIndex),
    toasted: Boolean(player?.toasted ?? player?.smoked),
    longestRoad: Number(player?.longestRoad) || 0,
    knightsUsed: Number(player?.knightsUsed) || 0,
    injuries: Number(player?.injuries) || 0,
  };
}

function normalizeMatch(match, colors, locations) {
  const players = (Array.isArray(match?.players) ? match.players : [])
    .map((player, index) => normalizePlayerEntry(player, colors, index))
    .filter((player) => player.name);

  const expansionsUsed = uniqueStrings(Array.isArray(match?.expansionsUsed) ? match.expansionsUsed : match?.expansion ? [match.expansion] : []).filter((item) => DEFAULT_EXPANSIONS.includes(item));
  const location = String(match?.location || locations[0] || '').trim();
  const host = String(match?.host || players[0]?.name || '').trim();
  const winner = players.some((player) => player.name === match?.winner) ? match.winner : players[0]?.name || '';

  return {
    id: match?.id || Date.now() + Math.random(),
    date: String(match?.date || todayIsoDate()),
    winner,
    location,
    host,
    expansionsUsed,
    timerMinutes: Number(match?.timerMinutes) || 0,
    players,
  };
}

function createEmptyMatch(locations) {
  return {
    date: todayIsoDate(),
    winner: '',
    location: locations[0] || '',
    host: '',
    expansionsUsed: [],
    timerMinutes: 0,
    players: [],
  };
}

function createPlayerRow(name, colors, index = 0) {
  return {
    name: name || '',
    color: colors[index % colors.length]?.name || colors[0]?.name || 'Red',
    toasted: false,
    longestRoad: 0,
    knightsUsed: 0,
    injuries: 0,
  };
}

function getPlayersFromMatches(matches) {
  const names = [];
  matches.forEach((match) => {
    names.push(match.winner, match.host);
    match.players.forEach((player) => names.push(player.name));
  });
  return uniqueStrings(names);
}

function getAllPlayers(matches, extraPlayers = [], directory = []) {
  return uniqueStrings([
    ...getPlayerNames(directory),
    ...getPlayersFromMatches(matches),
    ...extraPlayers.map((player) => player.name),
  ]);
}

function emptyStats(colors) {
  return {
    games: 0,
    wins: 0,
    losses: 0,
    hosted: 0,
    toastGames: 0,
    toastWins: 0,
    totalLongestRoad: 0,
    maxLongestRoad: 0,
    totalKnights: 0,
    maxKnights: 0,
    totalInjuries: 0,
    maxInjuries: 0,
    bestWinStreak: 0,
    currentWinStreak: 0,
    bestLoseStreak: 0,
    currentLoseStreak: 0,
    elo: 1000,
    colorUsage: Object.fromEntries(colors.map((color) => [color.name, 0])),
    winsByColor: Object.fromEntries(colors.map((color) => [color.name, 0])),
  };
}

function computeAnalytics(matches, players, colors) {
  const stats = Object.fromEntries(players.map((name) => [name, emptyStats(colors)]));
  const elo = Object.fromEntries(players.map((name) => [name, 1000]));
  const hostCounts = {};
  const venueCounts = {};
  const colorTotals = Object.fromEntries(colors.map((color) => [color.name, { plays: 0, wins: 0, hex: color.hex }]));
  let totalTimer = 0;
  let timedMatches = 0;

  const ordered = [...matches].sort((a, b) => new Date(a.date) - new Date(b.date));

  ordered.forEach((match) => {
    if (match.location) venueCounts[match.location] = (venueCounts[match.location] || 0) + 1;
    if (match.host) hostCounts[match.host] = (hostCounts[match.host] || 0) + 1;
    if (match.timerMinutes > 0) {
      totalTimer += match.timerMinutes;
      timedMatches += 1;
    }

    const participants = uniqueStrings(match.players.map((player) => player.name));
    participants.forEach((name) => {
      if (!stats[name]) {
        stats[name] = emptyStats(colors);
        elo[name] = 1000;
      }
      stats[name].games += 1;
      if (name !== match.winner) stats[name].losses += 1;
    });

    if (match.host) {
      if (!stats[match.host]) {
        stats[match.host] = emptyStats(colors);
        elo[match.host] = 1000;
      }
      stats[match.host].hosted += 1;
    }

    match.players.forEach((player) => {
      if (!stats[player.name]) return;
      const safeColor = safeColorName(player.color, colors);
      stats[player.name].colorUsage[safeColor] += 1;
      stats[player.name].totalLongestRoad += player.longestRoad || 0;
      stats[player.name].maxLongestRoad = Math.max(stats[player.name].maxLongestRoad, player.longestRoad || 0);
      stats[player.name].totalKnights += player.knightsUsed || 0;
      stats[player.name].maxKnights = Math.max(stats[player.name].maxKnights, player.knightsUsed || 0);
      stats[player.name].totalInjuries += player.injuries || 0;
      stats[player.name].maxInjuries = Math.max(stats[player.name].maxInjuries, player.injuries || 0);
      if (player.toasted) stats[player.name].toastGames += 1;
      colorTotals[safeColor].plays += 1;
    });

    const winnerEntry = match.players.find((player) => player.name === match.winner);
    if (match.winner && stats[match.winner]) {
      stats[match.winner].wins += 1;
      if (winnerEntry) {
        const safeColor = safeColorName(winnerEntry.color, colors);
        stats[match.winner].winsByColor[safeColor] += 1;
        if (winnerEntry.toasted) stats[match.winner].toastWins += 1;
        colorTotals[safeColor].wins += 1;
      }
    }

    const opponents = participants.filter((name) => name !== match.winner);
    opponents.forEach((opponent) => {
      const expected = 1 / (1 + 10 ** ((elo[opponent] - elo[match.winner]) / 400));
      const delta = 16 * (1 - expected);
      elo[match.winner] += delta;
      elo[opponent] -= delta;
    });
  });

  Object.keys(stats).forEach((name) => {
    stats[name].elo = Math.round(elo[name] || 1000);

    let currentWin = 0;
    let currentLose = 0;
    let bestWin = 0;
    let bestLose = 0;

    ordered.forEach((match) => {
      const participated = match.players.some((player) => player.name === name);
      if (!participated) return;
      if (match.winner === name) {
        currentWin += 1;
        currentLose = 0;
        bestWin = Math.max(bestWin, currentWin);
      } else {
        currentLose += 1;
        currentWin = 0;
        bestLose = Math.max(bestLose, currentLose);
      }
    });

    const recent = [...ordered].reverse().filter((match) => match.players.some((player) => player.name === name));
    let liveWins = 0;
    let liveLosses = 0;
    for (const match of recent) {
      if (match.winner === name) liveWins += 1;
      else break;
    }
    for (const match of recent) {
      if (match.winner !== name) liveLosses += 1;
      else break;
    }

    stats[name].bestWinStreak = bestWin;
    stats[name].bestLoseStreak = bestLose;
    stats[name].currentWinStreak = liveWins;
    stats[name].currentLoseStreak = liveLosses;
  });

  return {
    stats,
    hostCounts,
    venueCounts,
    colorTotals,
    averageTimer: timedMatches ? Math.round(totalTimer / timedMatches) : 0,
  };
}

function computeHeadToHead(matches, a, b) {
  if (!a || !b || a === b) {
    return { games: 0, winsA: 0, winsB: 0, averageTimer: 0, latest: null };
  }
  const relevant = matches.filter((match) => {
    const names = match.players.map((player) => player.name);
    return names.includes(a) && names.includes(b);
  });

  const winsA = relevant.filter((match) => match.winner === a).length;
  const winsB = relevant.filter((match) => match.winner === b).length;
  const timed = relevant.filter((match) => match.timerMinutes > 0);
  return {
    games: relevant.length,
    winsA,
    winsB,
    averageTimer: timed.length ? Math.round(timed.reduce((sum, match) => sum + match.timerMinutes, 0) / timed.length) : 0,
    latest: relevant.length ? [...relevant].sort((x, y) => new Date(y.date) - new Date(x.date))[0] : null,
  };
}

function computePlayerMatchups(matches, playerName) {
  if (!playerName) return [];
  const matchupMap = new Map();

  matches.forEach((match) => {
    const names = match.players.map((player) => player.name);
    if (!names.includes(playerName)) return;

    names.filter((name) => name !== playerName).forEach((opponent) => {
      if (!matchupMap.has(opponent)) {
        matchupMap.set(opponent, { opponent, games: 0, wins: 0, losses: 0, winRate: 0 });
      }
      const row = matchupMap.get(opponent);
      row.games += 1;
      if (match.winner === playerName) row.wins += 1;
      else row.losses += 1;
    });
  });

  return [...matchupMap.values()]
    .map((row) => ({ ...row, winRate: row.games ? Math.round((row.wins / row.games) * 100) : 0 }))
    .sort((a, b) => b.winRate - a.winRate || b.games - a.games || a.opponent.localeCompare(b.opponent));
}

function buildFunFacts(matches, ranking, analytics) {
  if (!matches.length) return ['No fun facts yet because no matches match the current filters.'];

  const longestMatch = [...matches].filter((match) => match.timerMinutes > 0).sort((a, b) => b.timerMinutes - a.timerMinutes)[0];
  const shortestMatch = [...matches].filter((match) => match.timerMinutes > 0).sort((a, b) => a.timerMinutes - b.timerMinutes)[0];
  const roadKing = [...ranking].sort((a, b) => b.maxLongestRoad - a.maxLongestRoad || b.totalKnights - a.totalKnights)[0];
  const toastKing = [...ranking].sort((a, b) => b.toastGames - a.toastGames || b.toastWins - a.toastWins)[0];
  const chaosVenue = Object.entries(analytics.venueCounts).sort((a, b) => b[1] - a[1])[0];

  const facts = [];
  if (roadKing) facts.push(`${roadKing.name} is the road ruler with a best longest road of ${roadKing.maxLongestRoad}.`);
  if (toastKing) facts.push(`${toastKing.name} leads the toast table with ${toastKing.toastGames} toasted games.`);
  if (longestMatch) facts.push(`The marathon match was ${longestMatch.timerMinutes} minutes on ${longestMatch.date} at ${longestMatch.location}.`);
  if (shortestMatch) facts.push(`The quickest finish was ${shortestMatch.timerMinutes} minutes on ${shortestMatch.date}.`);
  if (chaosVenue) facts.push(`${chaosVenue[0]} has hosted the most filtered matches so far.`);
  return facts;
}

function makeBoard(expansion, id) {
  const preset = MAP_PRESETS[expansion] || MAP_PRESETS['Base Game'];
  const terrains = shuffle(preset.terrainPool);
  const numbers = shuffle(preset.numberPool);
  let numberIndex = 0;
  const tiles = terrains.map((terrain, index) => {
    if (terrain === 'Desert') return { id: `${id}-${index}`, terrain, number: null };
    const value = numbers[numberIndex];
    numberIndex += 1;
    return { id: `${id}-${index}`, terrain, number: value };
  });
  return {
    id,
    title: `Board ${id}`,
    expansion,
    notes: '',
    postGamePlaces: [],
    newPlace: '',
    tiles,
  };
}

function terrainClass(terrain) {
  switch (terrain) {
    case 'Wood': return 'border-emerald-300 bg-emerald-500/25';
    case 'Wheat': return 'border-yellow-300 bg-yellow-500/25';
    case 'Sheep': return 'border-lime-300 bg-lime-500/25';
    case 'Brick': return 'border-orange-300 bg-orange-500/25';
    case 'Ore': return 'border-slate-200 bg-slate-500/25';
    case 'Gold': return 'border-amber-200 bg-amber-400/25';
    default: return 'border-amber-200 bg-amber-700/25';
  }
}

function recapLines(matches, players, analytics) {
  if (!matches.length) return ['No matches in the current filter set, so there is nothing to recap yet.'];

  const ordered = [...matches].sort((a, b) => new Date(a.date) - new Date(b.date));
  const winnerCounts = {};
  const expansionCounts = {};
  ordered.forEach((match) => {
    winnerCounts[match.winner] = (winnerCounts[match.winner] || 0) + 1;
    match.expansionsUsed.forEach((expansion) => {
      expansionCounts[expansion] = (expansionCounts[expansion] || 0) + 1;
    });
  });

  const topWinner = Object.entries(winnerCounts).sort((a, b) => b[1] - a[1])[0];
  const topHost = Object.entries(analytics.hostCounts).sort((a, b) => b[1] - a[1])[0];
  const topExpansion = Object.entries(expansionCounts).sort((a, b) => b[1] - a[1])[0];
  const toastLeader = [...players].sort((a, b) => (analytics.stats[b]?.toastGames || 0) - (analytics.stats[a]?.toastGames || 0))[0];
  const roadLeader = [...players].sort((a, b) => (analytics.stats[b]?.maxLongestRoad || 0) - (analytics.stats[a]?.maxLongestRoad || 0))[0];
  const fastest = [...ordered].filter((match) => match.timerMinutes > 0).sort((a, b) => a.timerMinutes - b.timerMinutes)[0];

  return [
    `${ordered.length} match${ordered.length > 1 ? 'es were' : ' was'} played between ${ordered[0].date} and ${ordered[ordered.length - 1].date}.`,
    topWinner ? `${topWinner[0]} led the night with ${topWinner[1]} win${topWinner[1] > 1 ? 's' : ''}.` : 'No winner data yet.',
    topHost ? `${topHost[0]} hosted the most with ${topHost[1]} table${topHost[1] > 1 ? 's' : ''}.` : 'No host data yet.',
    topExpansion ? `${topExpansion[0]} showed up the most among the selected matches.` : 'No expansion data yet.',
    toastLeader ? `${toastLeader} logged the most toasting games with ${analytics.stats[toastLeader]?.toastGames || 0}.` : 'No toast leader yet.',
    roadLeader ? `${roadLeader} built the best longest road at ${analytics.stats[roadLeader]?.maxLongestRoad || 0}.` : 'No road leader yet.',
    fastest ? `Fastest recorded match: ${fastest.date} at ${fastest.timerMinutes} minutes in ${fastest.location}.` : 'No match timers recorded yet.',
  ];
}

function Button({ children, onClick, variant = 'primary', className = '', type = 'button', ...props }) {
  const base = 'min-h-11 rounded-2xl px-4 py-2 text-sm font-medium transition';
  const style = variant === 'primary'
    ? 'border border-white/10 bg-white text-zinc-950 hover:bg-zinc-200'
    : 'border border-zinc-300 bg-white text-zinc-950 hover:bg-zinc-100 dark:border-white/20 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-800';
  return <button type={type} onClick={onClick} className={`${base} ${style} ${className}`} {...props}>{children}</button>;
}

function SectionCard({ title, icon: Icon, children, theme }) {
  const card = theme === 'dark' ? 'border-white/15 bg-zinc-900 text-white' : 'border-zinc-200 bg-white text-zinc-950';
  return (
    <section className={`rounded-3xl border p-4 shadow-sm sm:p-5 ${card}`}>
      <div className='mb-4 flex items-center gap-2'>
        {Icon ? <Icon className='h-5 w-5' /> : null}
        <h2 className='text-lg font-semibold'>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function TextInput({ value, onChange, placeholder = '', list, type = 'text', theme, min }) {
  const cls = theme === 'dark'
    ? 'border-white/20 bg-black text-white placeholder:text-zinc-400'
    : 'border-zinc-300 bg-white text-zinc-950 placeholder:text-zinc-500';
  return (
    <input
      type={type}
      min={min}
      list={list}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`min-h-11 w-full rounded-2xl border px-3 py-2 outline-none ${cls}`}
    />
  );
}

function SelectInput({ value, onChange, options, theme }) {
  const cls = theme === 'dark'
    ? 'border-white/20 bg-black text-white'
    : 'border-zinc-300 bg-white text-zinc-950';
  return (
    <select value={value} onChange={onChange} className={`min-h-11 w-full rounded-2xl border px-3 py-2 outline-none ${cls}`}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  );
}

function SimpleBarChart({ title, rows, theme, suffix = '', color = 'bg-emerald-500' }) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  return (
    <div className={`rounded-3xl border p-4 shadow-sm sm:p-5 ${theme === 'dark' ? 'border-white/15 bg-zinc-900 text-white' : 'border-zinc-200 bg-white text-zinc-950'}`}>
      <h3 className='mb-4 text-lg font-semibold'>{title}</h3>
      <div className='space-y-3'>
        {rows.length === 0 ? (
          <div className={`rounded-2xl border p-4 text-sm ${theme === 'dark' ? 'border-white/15 bg-zinc-950 text-zinc-200' : 'border-zinc-200 bg-zinc-50 text-zinc-600'}`}>
            No data for the current filters.
          </div>
        ) : rows.map((row) => (
          <div key={row.label}>
            <div className='mb-1 flex items-center justify-between gap-3 text-sm'>
              <span className='font-medium'>{row.label}</span>
              <span className={theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}>{row.value}{suffix}</span>
            </div>
            <div className={`h-3 rounded-full ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
              <div className={`h-3 rounded-full ${row.colorClass || color}`} style={{ width: `${(row.value / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CatanLiteManager() {
  const [theme, setTheme] = useState('dark');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [colorOptions, setColorOptions] = useState(DEFAULT_COLORS);
  const [locations, setLocations] = useState(DEFAULT_LOCATIONS);
  const [matches, setMatches] = useState(SEED_MATCHES.map((match) => normalizeMatch(match, DEFAULT_COLORS, DEFAULT_LOCATIONS)));
  const [playerDirectory, setPlayerDirectory] = useState(normalizePlayersDirectory(DEFAULT_PLAYERS, getPlayersFromMatches(SEED_MATCHES)));
  const [editingMatchId, setEditingMatchId] = useState(null);
  const [newMatch, setNewMatch] = useState(createEmptyMatch(DEFAULT_LOCATIONS));
  const [filters, setFilters] = useState(() => ({ ...DEFAULT_FILTERS }));
  const [headToHead, setHeadToHead] = useState({ a: 'Juani', b: 'Mora' });
  const [selectedProfile, setSelectedProfile] = useState('Juani');
  const [boards, setBoards] = useState([makeBoard('Base Game', 1)]);
  const [newPlayer, setNewPlayer] = useState({ name: '' });
  const [playerEditor, setPlayerEditor] = useState({ target: 'Juani', nextName: 'Juani' });
  const [newLocation, setNewLocation] = useState('');
  const [locationEditor, setLocationEditor] = useState({ target: DEFAULT_LOCATIONS[0], nextName: DEFAULT_LOCATIONS[0] });
  const [newColor, setNewColor] = useState({ name: '', hex: '#22c55e' });
  const [colorEditor, setColorEditor] = useState({ target: DEFAULT_COLORS[0].name, nextName: DEFAULT_COLORS[0].name, nextHex: DEFAULT_COLORS[0].hex });
  const [importText, setImportText] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      const nextColors = normalizeColorOptions(saved.colorOptions || DEFAULT_COLORS);
      const nextLocations = uniqueStrings([...(saved.locations || DEFAULT_LOCATIONS), ...DEFAULT_LOCATIONS]);
      const nextMatches = (saved.matches || SEED_MATCHES).map((match) => normalizeMatch(match, nextColors, nextLocations));
      const nextDirectory = normalizePlayersDirectory(saved.playerDirectory || DEFAULT_PLAYERS, getPlayersFromMatches(nextMatches));
      setTheme(saved.theme === 'light' ? 'light' : 'dark');
      setColorOptions(nextColors);
      setLocations(nextLocations);
      setMatches(nextMatches);
      setPlayerDirectory(nextDirectory);
      setSelectedProfile(nextDirectory[0]?.name || '');
      setPlayerEditor({
        target: nextDirectory[0]?.name || '',
        nextName: nextDirectory[0]?.name || '',
      });
      if (Array.isArray(saved.boards) && saved.boards.length) {
        setBoards(saved.boards.map((board, index) => ({ ...makeBoard(board.expansion || 'Base Game', index + 1), ...board, id: index + 1, newPlace: '' })));
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    const payload = { theme, colorOptions, locations, matches, playerDirectory, boards };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [theme, colorOptions, locations, matches, playerDirectory, boards]);

  const playerNames = useMemo(() => getPlayerNames(playerDirectory), [playerDirectory]);
  const knownPlayers = useMemo(() => getAllPlayers(matches, newMatch.players, playerDirectory), [matches, newMatch.players, playerDirectory]);

  const filteredMatches = useMemo(() => {
    return matches.filter((match) => {
      if (filters.expansion !== 'all' && !match.expansionsUsed.includes(filters.expansion)) return false;
      if (filters.playerCount !== 'all' && String(match.players.length) !== filters.playerCount) return false;
      if (filters.host !== 'all' && match.host !== filters.host) return false;
      if (filters.location !== 'all' && match.location !== filters.location) return false;
      if (filters.dateFrom && match.date < filters.dateFrom) return false;
      if (filters.dateTo && match.date > filters.dateTo) return false;
      return true;
    });
  }, [matches, filters]);

  const analyticsPlayers = useMemo(() => uniqueStrings([...playerNames, ...getPlayersFromMatches(filteredMatches)]), [playerNames, filteredMatches]);
  const analytics = useMemo(() => computeAnalytics(filteredMatches, analyticsPlayers, colorOptions), [filteredMatches, analyticsPlayers, colorOptions]);

  const ranking = useMemo(() => {
    return analyticsPlayers
      .map((name) => {
        const s = analytics.stats[name] || emptyStats(colorOptions);
        return {
          name,
          games: s.games,
          wins: s.wins,
          losses: s.losses,
          elo: s.elo,
          hosted: s.hosted,
          bestWinStreak: s.bestWinStreak,
          bestLoseStreak: s.bestLoseStreak,
          toastGames: s.toastGames,
          maxLongestRoad: s.maxLongestRoad,
          totalKnights: s.totalKnights,
          totalInjuries: s.totalInjuries,
          winRate: s.games ? Math.round((s.wins / s.games) * 100) : 0,
          colorUsage: s.colorUsage,
          winsByColor: s.winsByColor,
        };
      })
      .sort((a, b) => b.elo - a.elo || b.wins - a.wins || a.name.localeCompare(b.name));
  }, [analyticsPlayers, analytics.stats, colorOptions]);

  const topWinner = ranking[0];
  const bestRoad = [...ranking].sort((a, b) => b.maxLongestRoad - a.maxLongestRoad)[0];
  const toastLeader = [...ranking].sort((a, b) => b.toastGames - a.toastGames)[0];
  const winStreakLeader = [...ranking].sort((a, b) => b.bestWinStreak - a.bestWinStreak)[0];
  const loseStreakLeader = [...ranking].sort((a, b) => b.bestLoseStreak - a.bestLoseStreak)[0];
  const head = useMemo(() => computeHeadToHead(filteredMatches, headToHead.a, headToHead.b), [filteredMatches, headToHead]);

  const chartWinRateRows = useMemo(() => ranking.filter((player) => player.games > 0).map((player) => ({
    label: player.name,
    value: player.winRate,
  })), [ranking]);

  const chartColorRows = useMemo(() => colorOptions.map((color) => ({
    label: color.name,
    value: analytics.colorTotals[color.name]?.wins || 0,
  })), [colorOptions, analytics.colorTotals]);

  const chartVenueRows = useMemo(() => Object.entries(analytics.venueCounts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value), [analytics.venueCounts]);

  const profileName = knownPlayers.includes(selectedProfile) ? selectedProfile : knownPlayers[0] || '';
  const profileStats = profileName ? analytics.stats[profileName] || emptyStats(colorOptions) : emptyStats(colorOptions);
  const profileMatches = filteredMatches.filter((match) => match.players.some((player) => player.name === profileName)).sort((a, b) => new Date(b.date) - new Date(a.date));
  const profileMatchups = useMemo(() => computePlayerMatchups(filteredMatches, profileName), [filteredMatches, profileName]);
  const bestMatchup = profileMatchups[0];
  const worstMatchup = [...profileMatchups].sort((a, b) => a.winRate - b.winRate || b.games - a.games || a.opponent.localeCompare(b.opponent))[0];
  const recap = useMemo(() => recapLines(filteredMatches, analyticsPlayers, analytics), [filteredMatches, analyticsPlayers, analytics]);
  const funFacts = useMemo(() => buildFunFacts(filteredMatches, ranking, analytics), [filteredMatches, ranking, analytics]);

  const rootClass = theme === 'dark' ? 'min-h-screen bg-gradient-to-br from-black via-zinc-950 to-zinc-900 text-white' : 'min-h-screen bg-gradient-to-br from-zinc-100 via-white to-zinc-100 text-zinc-950';
  const muted = theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600';
  const panel = theme === 'dark' ? 'border-white/15 bg-zinc-900' : 'border-zinc-200 bg-white';
  const soft = theme === 'dark' ? 'border-white/12 bg-zinc-950' : 'border-zinc-200 bg-zinc-50';
  const dateFilterInvalid = Boolean(filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo);

  const expansionOptions = [{ value: 'all', label: 'All expansions' }, ...DEFAULT_EXPANSIONS.map((item) => ({ value: item, label: item }))];
  const playerCountOptions = [{ value: 'all', label: 'All player counts' }, ...[2, 3, 4, 5, 6, 7, 8].map((item) => ({ value: String(item), label: `${item} players` }))];
  const hostOptions = [{ value: 'all', label: 'All hosts' }, ...playerNames.map((item) => ({ value: item, label: item }))];
  const locationOptions = [{ value: 'all', label: 'All locations' }, ...locations.map((item) => ({ value: item, label: item }))];

  const saveMatch = () => {
    const players = newMatch.players.map((player, index) => normalizePlayerEntry(player, colorOptions, index)).filter((player) => player.name);
    const playerKeys = players.map((player) => player.name.toLowerCase());
    const hasDuplicatePlayers = new Set(playerKeys).size !== playerKeys.length;
    const winner = String(newMatch.winner || '').trim();
    const host = String(newMatch.host || '').trim();
    const location = String(newMatch.location || '').trim();

    if (!newMatch.date) {
      setStatus('Add a date before saving the match.');
      return;
    }
    if (players.length < 2) {
      setStatus('Add at least two players before saving the match.');
      return;
    }
    if (hasDuplicatePlayers) {
      setStatus('Each player can only appear once in the same match.');
      return;
    }
    if (!location) {
      setStatus('Add a location before saving the match.');
      return;
    }
    if (!winner || !players.some((player) => player.name === winner)) {
      setStatus('Pick a winner from the players in this match.');
      return;
    }
    if (!host || !players.some((player) => player.name === host)) {
      setStatus('Pick a host from the players in this match.');
      return;
    }
    if (!newMatch.expansionsUsed.length) {
      setStatus('Pick at least one expansion before saving the match.');
      return;
    }
    if (Number(newMatch.timerMinutes) < 0) {
      setStatus('Timer minutes cannot be negative.');
      return;
    }

    const payload = normalizeMatch(
      {
        id: editingMatchId || Date.now(),
        date: newMatch.date,
        winner,
        location,
        host,
        expansionsUsed: newMatch.expansionsUsed,
        timerMinutes: newMatch.timerMinutes,
        players,
      },
      colorOptions,
      locations
    );

    setMatches((prev) => editingMatchId ? prev.map((match) => (match.id === editingMatchId ? payload : match)) : [...prev, payload]);
    setPlayerDirectory((prev) => normalizePlayersDirectory(prev, [...players.map((player) => player.name), payload.winner, payload.host]));
    setLocations((prev) => uniqueStrings([...prev, payload.location]));
    setEditingMatchId(null);
    setNewMatch(createEmptyMatch(uniqueStrings([...locations, payload.location])));
    setStatus('Match saved.');
  };

  const deleteMatch = (match) => {
    if (!window.confirm(`Delete the match from ${match.date} at ${match.location}?`)) return;
    setMatches((prev) => prev.filter((item) => item.id !== match.id));
    setStatus('Match deleted.');
  };

  const loadMatchForEdit = (match) => {
    setEditingMatchId(match.id);
    setNewMatch({
      date: match.date,
      winner: match.winner,
      location: match.location,
      host: match.host,
      expansionsUsed: [...match.expansionsUsed],
      timerMinutes: match.timerMinutes,
      players: match.players.map((player) => ({ ...player })),
    });
    setActiveTab('matches');
  };

  const addBoard = () => setBoards((prev) => [...prev, makeBoard('Base Game', prev.length + 1)]);
  const removeBoard = (id) => {
    if (!window.confirm('Remove this generated board?')) return;
    setBoards((prev) => prev.length <= 1 ? prev : prev.filter((board) => board.id !== id).map((board, index) => ({ ...board, id: index + 1, title: `Board ${index + 1}` })));
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ theme, colorOptions, locations, matches, playerDirectory, boards }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `catan-lite-export-${todayIsoDate()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = () => {
    try {
      const parsed = JSON.parse(importText);
      if (!window.confirm('Importing JSON will replace the current local data. Continue?')) return;
      const nextColors = normalizeColorOptions(parsed.colorOptions || colorOptions);
      const nextLocations = uniqueStrings([...(parsed.locations || []), ...DEFAULT_LOCATIONS]);
      const nextMatches = (parsed.matches || []).map((match) => normalizeMatch(match, nextColors, nextLocations));
      const nextDirectory = normalizePlayersDirectory(parsed.playerDirectory || [], getPlayersFromMatches(nextMatches));
      setTheme(parsed.theme === 'light' ? 'light' : 'dark');
      setColorOptions(nextColors);
      setLocations(nextLocations);
      setMatches(nextMatches);
      setPlayerDirectory(nextDirectory);
      setBoards(Array.isArray(parsed.boards) && parsed.boards.length ? parsed.boards.map((board, index) => ({ ...makeBoard(board.expansion || 'Base Game', index + 1), ...board, id: index + 1, newPlace: '' })) : [makeBoard('Base Game', 1)]);
      setSelectedProfile(nextDirectory[0]?.name || '');
      setStatus(`Imported ${nextMatches.length} matches.`);
    } catch (error) {
      setStatus('Import failed. Check the JSON and try again.');
    }
  };

  return (
    <div className={rootClass}>
      <datalist id='player-list'>
        {knownPlayers.map((name) => <option key={name} value={name} />)}
      </datalist>
      <datalist id='location-list'>
        {locations.map((location) => <option key={location} value={location} />)}
      </datalist>

      <div className='mx-auto max-w-7xl px-4 py-5 sm:px-6 md:px-8 lg:px-10'>
        <header className='mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
          <div>
            <div className={`mb-3 inline-flex rounded-full border px-3 py-1 text-sm ${panel}`}>Catan Lite Manager</div>
            <h1 className='text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl'>League tracker, profiles, recap, and maps</h1>
            <p className={`mt-3 max-w-3xl text-sm sm:text-base ${muted}`}>
              Lightweight, mobile-first, and focused on the good stuff: head-to-head stats, better filters, a night recap, theme switching, and cleaner match entry.
            </p>
          </div>
          <div className='flex flex-col gap-3 sm:flex-row'>
            <Button variant='secondary' onClick={() => setTheme((prev) => prev === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <Sun className='mr-2 inline h-4 w-4' /> : <Moon className='mr-2 inline h-4 w-4' />} Theme
            </Button>
            <Button variant='secondary' onClick={exportJson}><Download className='mr-2 inline h-4 w-4' />Export</Button>
          </div>
        </header>

        <div className={`mb-6 rounded-3xl border p-4 sm:p-5 ${panel}`}>
          <div className='mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
            <div className='flex items-center gap-2'><Filter className='h-5 w-5' /><h2 className='text-lg font-semibold'>Filters</h2></div>
            <Button variant='secondary' onClick={() => setFilters({ ...DEFAULT_FILTERS })}>Clear filters</Button>
          </div>
          <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-6'>
            <div>
              <Label text='Expansion' theme={theme} />
              <SelectInput theme={theme} value={filters.expansion} onChange={(e) => setFilters((prev) => ({ ...prev, expansion: e.target.value }))} options={expansionOptions} />
            </div>
            <div>
              <Label text='Player count' theme={theme} />
              <SelectInput theme={theme} value={filters.playerCount} onChange={(e) => setFilters((prev) => ({ ...prev, playerCount: e.target.value }))} options={playerCountOptions} />
            </div>
            <div>
              <Label text='Host' theme={theme} />
              <SelectInput theme={theme} value={filters.host} onChange={(e) => setFilters((prev) => ({ ...prev, host: e.target.value }))} options={hostOptions} />
            </div>
            <div>
              <Label text='Location' theme={theme} />
              <SelectInput theme={theme} value={filters.location} onChange={(e) => setFilters((prev) => ({ ...prev, location: e.target.value }))} options={locationOptions} />
            </div>
            <div>
              <Label text='Date from' theme={theme} />
              <TextInput theme={theme} type='date' value={filters.dateFrom} onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))} />
            </div>
            <div>
              <Label text='Date to' theme={theme} />
              <TextInput theme={theme} type='date' value={filters.dateTo} onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))} />
            </div>
          </div>
          {dateFilterInvalid ? <p className={`mt-3 text-sm ${muted}`}>Date from must be before date to.</p> : null}
        </div>

        {status ? (
          <div className={`mb-6 rounded-2xl border p-4 text-sm ${soft}`}>
            {status}
          </div>
        ) : null}

        <nav className='mb-6 flex flex-wrap gap-2'>
          {['dashboard', 'charts', 'matches', 'profiles', 'recap', 'map', 'setup'].map((tab) => {
            const active = activeTab === tab;
            const base = theme === 'dark' ? (active ? 'bg-zinc-800 border-white/20' : 'bg-zinc-900 border-white/15') : (active ? 'bg-zinc-200 border-zinc-300' : 'bg-white border-zinc-200');
            return (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`min-h-11 flex-1 rounded-2xl border px-4 py-2 text-sm font-medium capitalize ${base}`}>
                {tab === 'map' ? 'Map generator' : tab}
              </button>
            );
          })}
        </nav>

        {activeTab === 'dashboard' ? (
          <div className='space-y-6'>
            <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
              <Stat title='Filtered matches' value={filteredMatches.length} subtitle={`${matches.length} total saved`} icon={Trophy} theme={theme} />
              <Stat title='Top winner' value={topWinner?.name || '-'} subtitle={topWinner ? `${topWinner.wins} wins` : 'No data'} icon={Users} theme={theme} />
              <Stat title='Best win streak' value={winStreakLeader?.name || '-'} subtitle={winStreakLeader ? `${winStreakLeader.bestWinStreak} wins in a row` : 'No streak'} icon={Route} theme={theme} />
              <Stat title='Average time' value={analytics.averageTimer ? `${analytics.averageTimer} min` : '-'} subtitle='Across filtered matches' icon={Clock3} theme={theme} />
            </div>

            <div className='grid gap-6 xl:grid-cols-[1.15fr_0.85fr]'>
              <SectionCard title='Rankings' icon={Users} theme={theme}>
                <div className='space-y-3'>
                  {ranking.length === 0 ? <EmptyState theme={theme} text='No matches match the current filters.' /> : ranking.map((player, index) => {
                    const bestColor = colorOptions.map((color) => ({ name: color.name, wins: player.winsByColor[color.name] || 0 })).sort((a, b) => b.wins - a.wins)[0]?.name || '-';
                    return (
                      <div key={player.name} className={`rounded-2xl border p-4 ${soft}`}>
                        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                          <div>
                            <div className='flex items-center gap-3'>
                              <span className={`flex h-8 w-8 items-center justify-center rounded-full border ${theme === 'dark' ? 'border-white/20 bg-zinc-800' : 'border-zinc-200 bg-zinc-100'}`}>#{index + 1}</span>
                              <div>
                                <p className='font-semibold'>{player.name}</p>
                                <p className={`text-sm ${muted}`}>{player.wins} wins / {player.losses} losses / {player.games} games</p>
                              </div>
                            </div>
                          </div>
                          <div className='flex flex-wrap gap-2'>
                            <Pill theme={theme}>ELO {player.elo}</Pill>
                            <Pill theme={theme}>Win rate {player.winRate}%</Pill>
                            <Pill theme={theme}>Best color {bestColor}</Pill>
                            <Pill theme={theme}>Road {player.maxLongestRoad}</Pill>
                          </div>
                        </div>
                        <div className='mt-3'>
                          <div className={`mb-1 flex items-center justify-between text-xs ${muted}`}><span>Win rate</span><span>{player.winRate}%</span></div>
                          <div className={`h-2 rounded-full ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
                            <div className='h-2 rounded-full bg-emerald-500' style={{ width: `${player.winRate}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SectionCard>

              <div className='space-y-6'>
                <SectionCard title='Head to head' icon={Users} theme={theme}>
                  <div className='grid gap-4 sm:grid-cols-2'>
                    <div>
                      <Label text='Player A' theme={theme} />
                      <SelectInput theme={theme} value={headToHead.a} onChange={(e) => setHeadToHead((prev) => ({ ...prev, a: e.target.value }))} options={playerNames.map((name) => ({ value: name, label: name }))} />
                    </div>
                    <div>
                      <Label text='Player B' theme={theme} />
                      <SelectInput theme={theme} value={headToHead.b} onChange={(e) => setHeadToHead((prev) => ({ ...prev, b: e.target.value }))} options={playerNames.map((name) => ({ value: name, label: name }))} />
                    </div>
                  </div>
                  <div className='mt-4 grid gap-3 sm:grid-cols-2'>
                    <MiniStat title='Shared matches' value={head.games} theme={theme} />
                    <MiniStat title='Average time' value={head.averageTimer ? `${head.averageTimer} min` : '-'} theme={theme} />
                    <MiniStat title={`${headToHead.a || 'A'} wins`} value={head.winsA} theme={theme} />
                    <MiniStat title={`${headToHead.b || 'B'} wins`} value={head.winsB} theme={theme} />
                  </div>
                  <div className={`mt-4 rounded-2xl border p-4 ${soft}`}>
                    {head.latest ? (
                      <p className={muted}>Latest duel: {head.latest.date} / winner: <span className='font-semibold text-current'>{head.latest.winner}</span> / {head.latest.location}</p>
                    ) : (
                      <p className={muted}>Pick two different players to see head-to-head results.</p>
                    )}
                  </div>
                </SectionCard>

                <SectionCard title='Highlights' icon={House} theme={theme}>
                  <div className='space-y-3'>
                    <MiniStat title='Top host' value={Object.entries(analytics.hostCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-'} subtitle={Object.entries(analytics.hostCounts).sort((a, b) => b[1] - a[1])[0]?.[1] ? `${Object.entries(analytics.hostCounts).sort((a, b) => b[1] - a[1])[0][1]} hosted` : 'No data'} theme={theme} />
                    <MiniStat title='Toast leader' value={toastLeader?.name || '-'} subtitle={toastLeader ? `${toastLeader.toastGames} toasted games` : 'No data'} theme={theme} />
                    <MiniStat title='Best road' value={bestRoad?.name || '-'} subtitle={bestRoad ? `${bestRoad.maxLongestRoad} longest road` : 'No data'} theme={theme} />
                    <MiniStat title='Worst run' value={loseStreakLeader?.name || '-'} subtitle={loseStreakLeader ? `${loseStreakLeader.bestLoseStreak} straight losses` : 'No data'} theme={theme} />
                  </div>
                </SectionCard>

                <SectionCard title='Fun facts' icon={Sparkles} theme={theme}>
                  <div className='space-y-3'>
                    {funFacts.map((fact, index) => (
                      <div key={index} className={`rounded-2xl border p-4 ${soft}`}>
                        <p className={muted}>{fact}</p>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === 'charts' ? (
          <div className='space-y-6'>
            <div className='grid gap-6 xl:grid-cols-3'>
              <SimpleBarChart title='Win rate by player' rows={chartWinRateRows} theme={theme} suffix='%' color='bg-emerald-500' />
              <SimpleBarChart title='Wins by color' rows={chartColorRows} theme={theme} color='bg-sky-500' />
              <SimpleBarChart title='Matches by venue' rows={chartVenueRows} theme={theme} color='bg-violet-500' />
            </div>
          </div>
        ) : null}

        {activeTab === 'matches' ? (
          <div className='grid gap-6 xl:grid-cols-[0.95fr_1.05fr]'>
            <SectionCard title={editingMatchId ? 'Edit match' : 'Add match'} icon={Pencil} theme={theme}>
              <div className='space-y-4'>
                <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                  <Field label='Date' theme={theme}><TextInput theme={theme} type='date' value={newMatch.date} onChange={(e) => setNewMatch((prev) => ({ ...prev, date: e.target.value }))} /></Field>
                  <Field label='Location' theme={theme}><TextInput theme={theme} list='location-list' value={newMatch.location} onChange={(e) => setNewMatch((prev) => ({ ...prev, location: e.target.value }))} /></Field>
                  <Field label='Timer (minutes)' theme={theme}><TextInput theme={theme} type='number' min='0' value={newMatch.timerMinutes} onChange={(e) => setNewMatch((prev) => ({ ...prev, timerMinutes: Number(e.target.value) || 0 }))} /></Field>
                  <Field label='Winner' theme={theme}><TextInput theme={theme} list='player-list' value={newMatch.winner} onChange={(e) => setNewMatch((prev) => ({ ...prev, winner: e.target.value }))} /></Field>
                  <Field label='Host' theme={theme}><TextInput theme={theme} list='player-list' value={newMatch.host} onChange={(e) => setNewMatch((prev) => ({ ...prev, host: e.target.value }))} /></Field>
                </div>

                <div>
                  <Label text='Expansions used' theme={theme} />
                  <div className='flex flex-wrap gap-2'>
                    {DEFAULT_EXPANSIONS.map((expansion) => {
                      const active = newMatch.expansionsUsed.includes(expansion);
                      const btn = theme === 'dark'
                        ? active ? 'border-white/20 bg-zinc-700' : 'border-white/20 bg-zinc-950'
                        : active ? 'border-zinc-300 bg-zinc-200' : 'border-zinc-300 bg-white';
                      return (
                        <button key={expansion} onClick={() => setNewMatch((prev) => ({
                          ...prev,
                          expansionsUsed: prev.expansionsUsed.includes(expansion)
                            ? prev.expansionsUsed.filter((item) => item !== expansion)
                            : uniqueStrings([...prev.expansionsUsed, expansion]),
                        }))} className={`rounded-full border px-3 py-2 text-sm ${btn}`}>
                          {expansion}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className='flex flex-col gap-3 sm:flex-row sm:flex-wrap'>
                  <Button variant='secondary' onClick={() => setNewMatch((prev) => ({ ...prev, players: [...prev.players, createPlayerRow('', colorOptions, prev.players.length)] }))}><Plus className='mr-2 inline h-4 w-4' />Add player row</Button>
                  {playerNames.slice(0, 10).map((name) => (
                    <Button key={name} variant='secondary' onClick={() => setNewMatch((prev) => ({ ...prev, players: [...prev.players, createPlayerRow(name, colorOptions, prev.players.length)] }))}>
                      {name}
                    </Button>
                  ))}
                </div>

                {newMatch.players.length === 0 ? <EmptyState theme={theme} text='No players added yet. Start with a blank row or a quick-add player.' /> : null}

                <div className='space-y-3'>
                  {newMatch.players.map((player, index) => (
                    <div key={`${player.name}-${index}`} className={`rounded-2xl border p-4 ${soft}`}>
                      <div className='mb-3 flex items-center justify-between gap-3'>
                        <div className='flex items-center gap-3'>
                          <span className='font-medium'>Player {index + 1}</span>
                        </div>
                        <button
                          onClick={() => setNewMatch((prev) => ({ ...prev, players: prev.players.filter((_, row) => row !== index) }))}
                          className='rounded-xl p-2 hover:bg-black/10'
                          aria-label={`Remove player row ${index + 1}`}
                        >
                          <Trash2 className='h-4 w-4' />
                        </button>
                      </div>
                      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                        <Field label='Name' theme={theme}><TextInput theme={theme} list='player-list' value={player.name} onChange={(e) => setNewMatch((prev) => ({
                          ...prev,
                          players: prev.players.map((item, row) => row === index ? { ...item, name: e.target.value } : item),
                        }))} /></Field>
                        <Field label='Color' theme={theme}>
                          <SelectInput theme={theme} value={player.color} onChange={(e) => setNewMatch((prev) => ({
                            ...prev,
                            players: prev.players.map((item, row) => row === index ? { ...item, color: e.target.value } : item),
                          }))} options={colorOptions.map((color) => ({ value: color.name, label: color.name }))} />
                        </Field>
                        <Field label='Toasted' theme={theme}>
                          <label className={`flex min-h-11 items-center rounded-2xl border px-3 ${theme === 'dark' ? 'border-white/20 bg-black' : 'border-zinc-300 bg-white'}`}>
                            <input type='checkbox' checked={player.toasted} onChange={(e) => setNewMatch((prev) => ({
                              ...prev,
                              players: prev.players.map((item, row) => row === index ? { ...item, toasted: e.target.checked } : item),
                            }))} className='mr-3' />
                            <span>{player.toasted ? 'Yes' : 'No'}</span>
                          </label>
                        </Field>
                        <Field label='Longest road' theme={theme}><TextInput theme={theme} type='number' min='0' value={player.longestRoad} onChange={(e) => setNewMatch((prev) => ({ ...prev, players: prev.players.map((item, row) => row === index ? { ...item, longestRoad: Number(e.target.value) || 0 } : item) }))} /></Field>
                        <Field label='Knights used' theme={theme}><TextInput theme={theme} type='number' min='0' value={player.knightsUsed} onChange={(e) => setNewMatch((prev) => ({ ...prev, players: prev.players.map((item, row) => row === index ? { ...item, knightsUsed: Number(e.target.value) || 0 } : item) }))} /></Field>
                        <Field label='Injuries' theme={theme}><TextInput theme={theme} type='number' min='0' value={player.injuries} onChange={(e) => setNewMatch((prev) => ({ ...prev, players: prev.players.map((item, row) => row === index ? { ...item, injuries: Number(e.target.value) || 0 } : item) }))} /></Field>
                      </div>
                    </div>
                  ))}
                </div>

                <div className='flex flex-col gap-3 sm:flex-row'>
                  <Button onClick={saveMatch}><Trophy className='mr-2 inline h-4 w-4' />{editingMatchId ? 'Save changes' : 'Save match'}</Button>
                  {editingMatchId ? <Button variant='secondary' onClick={() => { setEditingMatchId(null); setNewMatch(createEmptyMatch(locations)); }}>Cancel edit</Button> : null}
                </div>
              </div>
            </SectionCard>

            <SectionCard title='Match history' icon={CalendarIcon} theme={theme}>
              <div className='space-y-3'>
                {[...filteredMatches].sort((a, b) => new Date(b.date) - new Date(a.date)).map((match) => (
                  <div key={match.id} className={`rounded-2xl border p-4 ${soft}`}>
                    <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                      <div>
                        <div className='flex items-center gap-2'>
                          <p className='font-semibold'>{match.winner} won</p>
                        </div>
                        <p className={`mt-1 text-sm ${muted}`}>{match.date} / {match.location} / hosted by {match.host} / {match.timerMinutes ? `${match.timerMinutes} min` : 'No timer'}</p>
                      </div>
                      <div className='flex flex-wrap gap-2'>
                        {match.expansionsUsed.map((expansion) => <Pill key={expansion} theme={theme}>{expansion}</Pill>)}
                      </div>
                    </div>
                    <div className='mt-3 flex flex-wrap gap-2'>
                      {match.players.map((player, index) => (
                        <div key={`${player.name}-${index}`} className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${soft}`}>
                          <span>{player.name}</span>
                          <span className={`h-2.5 w-2.5 rounded-full border ${theme === 'dark' ? 'border-white/20' : 'border-zinc-300'}`} style={{ backgroundColor: colorByName(player.color, colorOptions)?.hex || '#999' }} />
                        </div>
                      ))}
                    </div>
                    <div className='mt-3 flex flex-col gap-3 sm:flex-row'>
                      <Button variant='secondary' onClick={() => loadMatchForEdit(match)}><Pencil className='mr-2 inline h-4 w-4' />Edit</Button>
                      <Button variant='secondary' onClick={() => deleteMatch(match)}><Trash2 className='mr-2 inline h-4 w-4' />Delete</Button>
                    </div>
                  </div>
                ))}
                {!filteredMatches.length ? <EmptyState theme={theme} text='No matches found for the selected filters.' /> : null}
              </div>
            </SectionCard>
          </div>
        ) : null}

        {activeTab === 'profiles' ? (
          <div className='space-y-6'>
            <SectionCard title='Player profiles' icon={User} theme={theme}>
              <div className='grid gap-4 lg:grid-cols-[280px_1fr]'>
                <div>
                  <Label text='Selected player' theme={theme} />
                  <SelectInput theme={theme} value={profileName} onChange={(e) => setSelectedProfile(e.target.value)} options={knownPlayers.map((name) => ({ value: name, label: name }))} />
                </div>
                <div className={`rounded-2xl border p-4 ${soft}`}>
                  <div>
                    <h3 className='text-2xl font-semibold'>{profileName || 'No player selected'}</h3>
                    <p className={muted}>Profiles respect the current global filters.</p>
                  </div>
                </div>
              </div>

              {profileName ? (
                <>
                  <div className='mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
                    <Stat title='Games' value={profileStats.games} subtitle='Filtered matches' icon={Users} theme={theme} />
                    <Stat title='Wins' value={profileStats.wins} subtitle={`${profileStats.games ? Math.round((profileStats.wins / profileStats.games) * 100) : 0}% win rate`} icon={Trophy} theme={theme} />
                    <Stat title='Win streak' value={profileStats.bestWinStreak} subtitle={`Current ${profileStats.currentWinStreak}`} icon={Route} theme={theme} />
                    <Stat title='Lose streak' value={profileStats.bestLoseStreak} subtitle={`Current ${profileStats.currentLoseStreak}`} icon={Route} theme={theme} />
                    <Stat title='ELO' value={profileStats.elo} subtitle='Filtered ELO' icon={Shield} theme={theme} />
                    <Stat title='Longest road' value={profileStats.maxLongestRoad} subtitle={`Total ${profileStats.totalLongestRoad}`} icon={Route} theme={theme} />
                    <Stat title='Knights' value={profileStats.totalKnights} subtitle={`Best ${profileStats.maxKnights}`} icon={Shield} theme={theme} />
                    <Stat title='Toast games' value={profileStats.toastGames} subtitle={`Wins while toasting ${profileStats.toastWins}`} icon={Sparkles} theme={theme} />
                  </div>

                  <div className='mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]'>
                    <div className='space-y-6'>
                      <SectionCard title='Profile summary' icon={User} theme={theme}>
                        <div className='grid gap-3'>
                          <MiniStat title='Most used color' value={colorOptions.map((color) => ({ name: color.name, value: profileStats.colorUsage[color.name] || 0 })).sort((a, b) => b.value - a.value)[0]?.name || '-'} theme={theme} />
                          <MiniStat title='Best win color' value={colorOptions.map((color) => ({ name: color.name, value: profileStats.winsByColor[color.name] || 0 })).sort((a, b) => b.value - a.value)[0]?.name || '-'} theme={theme} />
                          <MiniStat title='Hosted' value={profileStats.hosted} theme={theme} />
                          <MiniStat title='Injuries tracked' value={profileStats.totalInjuries} subtitle={`Worst match ${profileStats.maxInjuries}`} theme={theme} />
                          <MiniStat title='Best matchup' value={bestMatchup?.opponent || '-'} subtitle={bestMatchup ? `${bestMatchup.wins}-${bestMatchup.losses} / ${bestMatchup.winRate}% win rate` : 'Not enough data'} theme={theme} />
                          <MiniStat title='Worst matchup' value={worstMatchup?.opponent || '-'} subtitle={worstMatchup ? `${worstMatchup.wins}-${worstMatchup.losses} / ${worstMatchup.winRate}% win rate` : 'Not enough data'} theme={theme} />
                        </div>
                      </SectionCard>
                    </div>
                    <SectionCard title='Recent matches' icon={Clock3} theme={theme}>
                      <div className='space-y-3'>
                        {profileMatches.map((match) => {
                          const player = match.players.find((item) => item.name === profileName);
                          return (
                            <div key={match.id} className={`rounded-2xl border p-4 ${soft}`}>
                              <p className='font-semibold'>{match.winner === profileName ? 'Win' : 'Loss'} / {match.date}</p>
                              <p className={`text-sm ${muted}`}>{match.location} / hosted by {match.host}</p>
                              <div className='mt-2 flex flex-wrap gap-2'>
                                {match.expansionsUsed.map((expansion) => <Pill key={expansion} theme={theme}>{expansion}</Pill>)}
                              </div>
                              {player ? (
                                <div className='mt-2 flex flex-wrap gap-2'>
                                  <Pill theme={theme}>Road {player.longestRoad}</Pill>
                                  <Pill theme={theme}>Knights {player.knightsUsed}</Pill>
                                  <Pill theme={theme}>{player.toasted ? 'Toasted' : 'No toast'}</Pill>
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                        {!profileMatches.length ? <EmptyState theme={theme} text='No profile matches under the current filters.' /> : null}
                      </div>
                    </SectionCard>
                  </div>
                </>
              ) : null}
            </SectionCard>
          </div>
        ) : null}

        {activeTab === 'recap' ? (
          <SectionCard title='Night recap' icon={Trophy} theme={theme}>
            <div className='grid gap-3'>
              {recap.map((line, index) => (
                <div key={index} className={`rounded-2xl border p-4 ${soft}`}>{line}</div>
              ))}
            </div>
            <div className='mt-6 grid gap-3'>
              {funFacts.map((fact, index) => (
                <div key={`fact-${index}`} className={`rounded-2xl border p-4 ${soft}`}>
                  <p className={muted}>{fact}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        ) : null}

        {activeTab === 'map' ? (
          <div className='space-y-6'>
            <SectionCard title='Map generator' icon={MapIcon} theme={theme}>
              <div className='flex flex-col gap-3 sm:flex-row'>
                <Button variant='secondary' onClick={addBoard}><Plus className='mr-2 inline h-4 w-4' />Add board</Button>
                <Button variant='secondary' onClick={() => {
                  if (!window.confirm('Regenerate every board layout?')) return;
                  setBoards((prev) => prev.map((board, index) => ({ ...makeBoard(board.expansion, index + 1), title: board.title, notes: board.notes, postGamePlaces: board.postGamePlaces, newPlace: '' })));
                }}>Regenerate all</Button>
              </div>
            </SectionCard>

            <div className='space-y-6'>
              {boards.map((board, boardIndex) => (
                <SectionCard key={board.id} title={board.title} icon={MapIcon} theme={theme}>
                  <div className='grid gap-4 lg:grid-cols-[1fr_220px]'>
                    <div>
                      <div className='grid gap-4 sm:grid-cols-2'>
                        <Field label='Board title' theme={theme}><TextInput theme={theme} value={board.title} onChange={(e) => setBoards((prev) => prev.map((item, row) => row === boardIndex ? { ...item, title: e.target.value } : item))} /></Field>
                        <Field label='Expansion preset' theme={theme}><SelectInput theme={theme} value={board.expansion} onChange={(e) => setBoards((prev) => prev.map((item, row) => row === boardIndex ? { ...item, expansion: e.target.value, tiles: makeBoard(e.target.value, item.id).tiles } : item))} options={DEFAULT_EXPANSIONS.map((expansion) => ({ value: expansion, label: expansion }))} /></Field>
                      </div>
                      <Field label='Notes' theme={theme}><TextInput theme={theme} value={board.notes} onChange={(e) => setBoards((prev) => prev.map((item, row) => row === boardIndex ? { ...item, notes: e.target.value } : item))} /></Field>
                      <div className='mt-4 grid gap-3'>
                        {BOARD_ROWS.map((size, rowIndex) => {
                          const start = BOARD_STARTS[rowIndex];
                          const rowTiles = board.tiles.slice(start, start + size);
                          return (
                            <div key={rowIndex} className='flex justify-center gap-2 sm:gap-3'>
                              {rowTiles.map((tile) => (
                                <div key={tile.id} className={`flex h-20 w-20 flex-col items-center justify-center rounded-3xl border text-center text-white sm:h-24 sm:w-24 ${terrainClass(tile.terrain)}`}>
                                  <span className='text-[10px] uppercase tracking-wide sm:text-xs'>{tile.terrain}</span>
                                  <span className='mt-1 text-lg font-bold sm:text-2xl'>{tile.number ?? '*'}</span>
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className={`rounded-2xl border p-4 ${soft}`}>
                      <div className='space-y-3'>
                        <Button variant='secondary' className='w-full' onClick={() => {
                          if (!window.confirm(`Regenerate ${board.title}?`)) return;
                          setBoards((prev) => prev.map((item, row) => row === boardIndex ? { ...item, tiles: makeBoard(item.expansion, item.id).tiles } : item));
                        }}>Regenerate board</Button>
                        <Button variant='secondary' className='w-full' onClick={() => removeBoard(board.id)}>Remove board</Button>
                        <Field label='Post-game place' theme={theme}>
                          <TextInput theme={theme} value={board.newPlace || ''} onChange={(e) => setBoards((prev) => prev.map((item, row) => row === boardIndex ? { ...item, newPlace: e.target.value } : item))} />
                        </Field>
                        <Button variant='secondary' className='w-full' onClick={() => {
                          const cleaned = String(board.newPlace || '').trim();
                          if (!cleaned) return;
                          setBoards((prev) => prev.map((item, row) => row === boardIndex ? { ...item, postGamePlaces: uniqueStrings([...item.postGamePlaces, cleaned]), newPlace: '' } : item));
                        }}>Add place</Button>
                        <div className='flex flex-wrap gap-2'>
                          {board.postGamePlaces.map((place, placeIndex) => (
                            <button
                              key={`${place}-${placeIndex}`}
                              onClick={() => {
                                if (!window.confirm(`Remove "${place}" from this board?`)) return;
                                setBoards((prev) => prev.map((item, row) => row === boardIndex ? { ...item, postGamePlaces: item.postGamePlaces.filter((_, current) => current !== placeIndex) } : item));
                              }}
                              className={`rounded-full border px-3 py-1 text-sm ${theme === 'dark' ? 'border-white/20 bg-zinc-800 text-white' : 'border-zinc-200 bg-zinc-100 text-zinc-950'}`}
                            >
                              {place} x
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </SectionCard>
              ))}
            </div>
          </div>
        ) : null}

        {activeTab === 'setup' ? (
          <div className='grid gap-6 xl:grid-cols-[0.9fr_1.1fr]'>
            <div className='space-y-6'>
              <SectionCard title='Player manager' icon={Users} theme={theme}>
                <div className='space-y-4'>
                  <div className='grid gap-3'>
                    {playerDirectory.map((player) => (
                      <div key={player.name} className={`flex items-center justify-between rounded-2xl border p-3 ${soft}`}>
                        <span>{player.name}</span>
                      </div>
                    ))}
                  </div>

                  <div className='grid gap-4 lg:grid-cols-[1fr_auto]'>
                    <Field label='New player' theme={theme}><TextInput theme={theme} value={newPlayer.name} onChange={(e) => setNewPlayer({ name: e.target.value })} /></Field>
                    <div className='self-end'><Button variant='secondary' className='w-full' onClick={() => {
                      if (!newPlayer.name.trim()) return;
                      setPlayerDirectory((prev) => normalizePlayersDirectory([...prev, { name: newPlayer.name.trim() }]));
                      setSelectedProfile(newPlayer.name.trim());
                      setNewPlayer({ name: '' });
                    }}><Plus className='mr-2 inline h-4 w-4' />Add</Button></div>
                  </div>

                  <div className='grid gap-4 lg:grid-cols-2'>
                    <Field label='Player to edit' theme={theme}><SelectInput theme={theme} value={playerEditor.target} onChange={(e) => {
                      setPlayerEditor({ target: e.target.value, nextName: e.target.value });
                    }} options={playerDirectory.map((player) => ({ value: player.name, label: player.name }))} /></Field>
                    <Field label='New name' theme={theme}><TextInput theme={theme} value={playerEditor.nextName} onChange={(e) => setPlayerEditor((prev) => ({ ...prev, nextName: e.target.value }))} /></Field>
                  </div>

                  <div className='flex flex-col gap-3 sm:flex-row'>
                    <Button variant='secondary' onClick={() => {
                      const target = playerEditor.target;
                      const nextName = playerEditor.nextName.trim();
                      if (!target || !nextName) return;
                      setPlayerDirectory((prev) => normalizePlayersDirectory(prev.map((player) => player.name === target ? { name: nextName } : player)));
                      setMatches((prev) => prev.map((match) => ({
                        ...match,
                        winner: match.winner === target ? nextName : match.winner,
                        host: match.host === target ? nextName : match.host,
                        players: match.players.map((player) => player.name === target ? { ...player, name: nextName } : player),
                      })));
                      setSelectedProfile(nextName);
                    }}>Rename everywhere</Button>
                    <Button variant='secondary' onClick={() => {
                      const target = playerEditor.target;
                      const used = matches.some((match) => match.winner === target || match.host === target || match.players.some((player) => player.name === target));
                      if (used) {
                        setStatus('That player is still used in saved matches.');
                        return;
                      }
                      if (!window.confirm(`Erase unused player "${target}"?`)) return;
                      setPlayerDirectory((prev) => prev.filter((player) => player.name !== target));
                      setStatus('Player erased.');
                    }}>Erase unused player</Button>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title='Locations & colors' icon={Settings2} theme={theme}>
                <div className='grid gap-6 lg:grid-cols-2'>
                  <div className='space-y-4'>
                    <h3 className='font-semibold'>Locations</h3>
                    <div className='flex flex-wrap gap-2'>{locations.map((location) => <Pill key={location} theme={theme}>{location}</Pill>)}</div>
                    <Field label='New location' theme={theme}><TextInput theme={theme} value={newLocation} onChange={(e) => setNewLocation(e.target.value)} /></Field>
                    <Button variant='secondary' onClick={() => {
                      if (!newLocation.trim()) return;
                      setLocations((prev) => uniqueStrings([...prev, newLocation.trim()]));
                      setNewLocation('');
                    }}>Add location</Button>
                    <div className='grid gap-3'>
                      <Field label='Location to edit' theme={theme}><SelectInput theme={theme} value={locationEditor.target} onChange={(e) => setLocationEditor({ target: e.target.value, nextName: e.target.value })} options={locations.map((location) => ({ value: location, label: location }))} /></Field>
                      <Field label='New name' theme={theme}><TextInput theme={theme} value={locationEditor.nextName} onChange={(e) => setLocationEditor((prev) => ({ ...prev, nextName: e.target.value }))} /></Field>
                    </div>
                    <div className='flex flex-col gap-3 sm:flex-row'>
                      <Button variant='secondary' onClick={() => {
                        const target = locationEditor.target;
                        const nextName = locationEditor.nextName.trim();
                        if (!target || !nextName) return;
                        setLocations((prev) => uniqueStrings(prev.map((location) => location === target ? nextName : location)));
                        setMatches((prev) => prev.map((match) => ({ ...match, location: match.location === target ? nextName : match.location })));
                      }}>Rename</Button>
                      <Button variant='secondary' onClick={() => {
                        const target = locationEditor.target;
                        if (matches.some((match) => match.location === target)) {
                          setStatus('That location is still used in saved matches.');
                          return;
                        }
                        if (!window.confirm(`Delete unused location "${target}"?`)) return;
                        setLocations((prev) => prev.filter((location) => location !== target));
                        setStatus('Location deleted.');
                      }}>Delete unused</Button>
                    </div>
                  </div>

                  <div className='space-y-4'>
                    <h3 className='font-semibold'>Colors</h3>
                    <div className='grid gap-3'>
                      {colorOptions.map((color) => (
                        <div key={color.name} className={`flex items-center justify-between rounded-2xl border p-3 ${soft}`}>
                          <div className='flex items-center gap-3'>
                            <span className='h-4 w-4 rounded-full border border-white/20' style={{ backgroundColor: color.hex }} />
                            <span>{color.name}</span>
                          </div>
                          <span className={muted}>{color.hex}</span>
                        </div>
                      ))}
                    </div>
                    <div className='grid gap-4 lg:grid-cols-[1fr_120px_auto]'>
                      <Field label='New color' theme={theme}><TextInput theme={theme} value={newColor.name} onChange={(e) => setNewColor((prev) => ({ ...prev, name: e.target.value }))} /></Field>
                      <Field label='Hex' theme={theme}><input type='color' value={newColor.hex} onChange={(e) => setNewColor((prev) => ({ ...prev, hex: e.target.value }))} className='h-11 w-full rounded-2xl border border-white/20 bg-transparent p-1' /></Field>
                      <div className='self-end'><Button variant='secondary' className='w-full' onClick={() => {
                        if (!newColor.name.trim()) return;
                        setColorOptions((prev) => normalizeColorOptions([...prev, { name: newColor.name.trim(), hex: newColor.hex }]));
                        setNewColor({ name: '', hex: '#22c55e' });
                      }}>Add color</Button></div>
                    </div>
                    <div className='grid gap-3'>
                      <Field label='Color to edit' theme={theme}><SelectInput theme={theme} value={colorEditor.target} onChange={(e) => {
                        const found = colorByName(e.target.value, colorOptions);
                        setColorEditor({ target: e.target.value, nextName: e.target.value, nextHex: found?.hex || '#ffffff' });
                      }} options={colorOptions.map((color) => ({ value: color.name, label: color.name }))} /></Field>
                      <Field label='New name' theme={theme}><TextInput theme={theme} value={colorEditor.nextName} onChange={(e) => setColorEditor((prev) => ({ ...prev, nextName: e.target.value }))} /></Field>
                      <Field label='Color picker' theme={theme}><input type='color' value={colorEditor.nextHex} onChange={(e) => setColorEditor((prev) => ({ ...prev, nextHex: e.target.value }))} className='h-11 w-full rounded-2xl border border-white/20 bg-transparent p-1' /></Field>
                      <Button variant='secondary' onClick={() => {
                        setColorOptions((prev) => normalizeColorOptions(prev.map((color) => color.name === colorEditor.target ? { name: colorEditor.nextName.trim(), hex: colorEditor.nextHex } : color)));
                      }}>Save color</Button>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>

            <div className='space-y-6'>
              <SectionCard title='Import / export' icon={Upload} theme={theme}>
                <div className='space-y-4'>
                  <textarea value={importText} onChange={(e) => setImportText(e.target.value)} className={`min-h-[240px] w-full rounded-2xl border p-4 text-sm outline-none ${theme === 'dark' ? 'border-white/20 bg-black text-white placeholder:text-zinc-400' : 'border-zinc-300 bg-white text-zinc-950 placeholder:text-zinc-500'}`} placeholder='Paste an exported JSON file here.' />
                  <div className='flex flex-col gap-3 sm:flex-row'>
                    <Button onClick={importJson}><Upload className='mr-2 inline h-4 w-4' />Import JSON</Button>
                    <Button variant='secondary' onClick={exportJson}><Download className='mr-2 inline h-4 w-4' />Export JSON</Button>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title='Current status' icon={Settings2} theme={theme}>
                <div className={`rounded-2xl border p-4 ${soft}`}>
                  <p className={muted}>{status || 'Everything looks good.'}</p>
                </div>
              </SectionCard>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Label({ text, theme }) {
  return <label className={`mb-2 block text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>{text}</label>;
}

function Field({ label, theme, children }) {
  return <div><Label text={label} theme={theme} />{children}</div>;
}

function Pill({ children, theme }) {
  return <span className={`rounded-full border px-3 py-1 text-sm ${theme === 'dark' ? 'border-white/15 bg-zinc-800 text-white' : 'border-zinc-200 bg-zinc-100 text-zinc-950'}`}>{children}</span>;
}

function EmptyState({ text, theme }) {
  return <div className={`rounded-2xl border p-4 text-sm ${theme === 'dark' ? 'border-white/15 bg-zinc-950 text-zinc-200' : 'border-zinc-200 bg-zinc-50 text-zinc-600'}`}>{text}</div>;
}

function MiniStat({ title, value, subtitle = '', theme }) {
  return (
    <div className={`rounded-2xl border p-4 ${theme === 'dark' ? 'border-white/15 bg-zinc-950 text-white' : 'border-zinc-200 bg-zinc-50 text-zinc-950'}`}>
      <p className={`text-sm ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>{title}</p>
      <p className='mt-1 text-xl font-semibold'>{value}</p>
      {subtitle ? <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>{subtitle}</p> : null}
    </div>
  );
}

function Stat({ title, value, subtitle, icon: Icon, theme }) {
  return (
    <div className={`rounded-3xl border p-4 shadow-sm sm:p-5 ${theme === 'dark' ? 'border-white/15 bg-zinc-900 text-white' : 'border-zinc-200 bg-white text-zinc-950'}`}>
      <div className='flex items-start justify-between gap-4'>
        <div>
          <p className={`text-sm ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>{title}</p>
          <h3 className='mt-2 text-3xl font-semibold'>{value}</h3>
          <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>{subtitle}</p>
        </div>
        <div className={`rounded-2xl border p-3 ${theme === 'dark' ? 'border-white/15 bg-zinc-800' : 'border-zinc-200 bg-zinc-100'}`}>
          <Icon className='h-5 w-5' />
        </div>
      </div>
    </div>
  );
}

function CalendarIcon(props) {
  return <Clock3 {...props} />;
}
