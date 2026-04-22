# Catan Tracker
## Product Development Document
*Version 1.0 · April 2026*

---

## Table of Contents
1. [Vision & Purpose](#1-vision--purpose)
2. [Tech Stack](#2-tech-stack)
3. [Monorepo Structure](#3-monorepo-structure)
4. [Data Model](#4-data-model)
5. [Features](#5-features)
6. [API — Core CRUD Surfaces](#6-api--core-crud-surfaces)
7. [V1 Scope vs. Later Versions](#7-v1-scope-vs-later-versions)
8. [Open Questions](#8-open-questions)

---

## 1. Vision & Purpose

Catan Tracker is a web application for groups of Catan players to log their matches, track personal and group statistics, and compete through an ELO-based rating system. The app starts as a private tool for a friend group, designed to grow into a platform any group can adopt.

**The core promise:** turn every Catan night into data, and make that data fun to explore.

---

## 2. Tech Stack

### 2.1 Frontend

| Technology | Role |
|---|---|
| Vite | Build tool and dev server |
| React | UI component framework |
| Tailwind CSS | Utility-first styling |
| React Router | Client-side routing |
| TanStack Query (React Query) | Server state and caching |

### 2.2 Backend

| Technology | Role |
|---|---|
| Node.js | JavaScript runtime |
| Express or Fastify | HTTP server and REST API |
| PostgreSQL | Primary relational database |
| Prisma or Drizzle | ORM and query builder |
| JWT | Authentication tokens |
| Zod | Request schema validation |

### 2.3 Infrastructure

| Technology | Role |
|---|---|
| Monorepo (npm workspaces) | Shared types and utilities across apps |
| Docker + docker-compose | Reproducible local development environment |
| PostgreSQL container | Database service in docker-compose |

---

## 3. Monorepo Structure

All code lives in a single repository. A shared package holds TypeScript types, constants, and Zod schemas used by both the frontend and backend.

```
catan-tracker/
├── apps/
│   ├── web/              # Vite + React + Tailwind frontend
│   └── api/              # Node.js REST API
├── packages/
│   └── shared/           # Shared TypeScript types, constants, Zod schemas
├── docker-compose.yml    # Spins up API, web, and Postgres services
├── package.json          # Workspace root — runs scripts across all apps
└── .env.example          # Environment variable template
```

---

## 4. Data Model

The following entities form the core database schema.

### 4.1 Player

The central user of the app. Owns locations, participates in matches, and accumulates an ELO rating over time.

| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | Primary key |
| name | string | Display name |
| email | string | Unique, used for authentication |
| avatar_url | string | Optional profile picture URL |
| elo_rating | integer | Current ELO score, default 1000 |
| created_at | timestamp | Account creation date |

### 4.2 Location

A named place where matches are played. Owned by a player (the host). One player can have multiple locations.

| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | Primary key |
| owner_id | UUID (FK → Player) | Player who registered this location |
| name | string | e.g. "Pablo's place" |
| address | string | Optional address |

### 4.3 Expansion

Reference table of Catan expansions. Seeded by the system at startup. Not user-editable.

| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | Primary key |
| name | string | e.g. "Base Game", "Cities & Knights", "Seafarers" |

### 4.4 Daily Map

A board configuration generated each day. Powers the "map of the day" feature. Matches can optionally reference the daily map played.

| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | Primary key |
| map_date | date | Unique per calendar day |
| seed | string | Deterministic seed to reproduce the layout |
| tile_config | JSON | Hex tile positions and terrain types |
| number_config | JSON | Number token placement per tile |
| port_config | JSON | Port positions and types |

### 4.5 Match

A single session of Catan. The central entity that ties location, players, and stats together.

| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | Primary key |
| location_id | UUID (FK → Location) | Where it was played |
| expansion_id | UUID (FK → Expansion) | Expansion used |
| daily_map_id | UUID (FK → Daily Map) | Optional — if the day's map was played |
| played_at | timestamp | Date and time of the game |
| duration_minutes | integer | Optional total game duration |
| deck_layout | string | "single" or "double" board |
| notes | string | Optional free-text notes |

### 4.6 Match Player

The join entity between Match and Player. Holds all per-game statistics for each participant, including an ELO snapshot before and after.

| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | Primary key |
| match_id | UUID (FK → Match) | References Match |
| player_id | UUID (FK → Player) | References Player |
| color | string | Color chosen for this game |
| points | integer | Final victory points scored |
| winner | boolean | Whether this player won |
| longest_road | boolean | Held Longest Road at game end |
| largest_army | boolean | Held Largest Army at game end |
| elo_before | integer | ELO rating before this match |
| elo_after | integer | ELO rating after this match |

### 4.7 Rating History

An append-only log of every ELO change. Used for trend charts, season summaries, and personal records.

| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | Primary key |
| player_id | UUID (FK → Player) | References Player |
| match_id | UUID (FK → Match) | Match that triggered this change |
| elo_before | integer | Rating before the match |
| elo_after | integer | Rating after the match |
| delta | integer | Positive = gain, negative = loss |
| recorded_at | timestamp | When the change was recorded |

### 4.8 Achievement

System-defined badge definitions. Seeded at startup. Criteria are evaluated automatically after each match is logged.

| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | Primary key |
| name | string | e.g. "Road King" |
| description | string | e.g. "Hold Longest Road 3 games in a row" |
| icon_name | string | Icon identifier for the frontend |
| category | string | "milestones", "streaks", "colors", "records" |
| criteria_type | string | Machine-readable type for evaluation logic |
| criteria_value | string | Threshold or condition value |

### 4.9 Player Achievement

Records which achievements each player has unlocked, and which match triggered the unlock.

| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | Primary key |
| player_id | UUID (FK → Player) | References Player |
| achievement_id | UUID (FK → Achievement) | References Achievement |
| match_id | UUID (FK → Match) | Match that triggered the unlock |
| unlocked_at | timestamp | When the achievement was earned |

---

## 5. Features

### 5.1 Match Logging (Simple Mode)

After a game ends, any participant logs the match. Fields captured:

- Players who participated and their chosen colors
- Who won and final points per player
- Match duration (optional)
- Longest Road and Largest Army holders
- Expansion played and deck layout (single or double board)
- Optional free-text notes

### 5.2 Hardcore Tracking — The Botonera

An optional live mode for a designated scorekeeper. One player runs the Botonera throughout the session.

**Flow:** tap Start → timer begins → declare players and colors → log events in real time via simple taps.

**Tracks in real time:**
- Resources gained per turn
- Development cards played (knight, road building, year of plenty, monopoly, victory point)
- Settlements and cities built
- Robber usage — who robbed whom
- Ports used

> Scoped to **Version 2**.

### 5.3 Map Generator

A tool for randomizing the Catan board before a game.

- Randomize tile placement, terrain distribution, number tokens, and port positions
- Toggle house rules (e.g. no adjacent 6 and 8 tokens)
- Beginner layout mode with fixed positions
- Board size selection (3–4 player standard, 5–6 player extension)
- Export or share the map as an image or shareable link
- Save the generated map to a match for future reference
- **Daily Map:** one shared map generated each day for the whole community

### 5.4 Player Statistics

Each player profile shows aggregated stats across all their matches:

- Overall win rate and win rate broken down by player count (3P, 4P, 5P, 6P)
- Average final points across wins and losses
- Favorite color and win rate per color
- Frequency of holding Longest Road and Largest Army
- Head-to-head record against each other player
- Nemesis (player who beats you most) and Rival (player you beat most)
- Home advantage: win rate broken down by location
- Win rate by expansion and by starting position (first pick vs. last pick)

### 5.5 ELO Rating System

Every player starts at **1000 ELO**. After each match, ratings update based on outcome and the relative ratings of all participants.

- Beating a higher-rated player earns more points
- Player count is factored in — a 6-player win is weighted appropriately
- All changes are logged in Rating History for charting
- A global leaderboard ranks all players by current ELO

### 5.6 Achievements & Badges

Achievements unlock automatically when criteria are met after a match is logged.

| Achievement | Criteria | Category |
|---|---|---|
| First Blood | Win your first match | Milestones |
| Color Collector | Win a game with every available color | Colors |
| Road King / Queen | Hold Longest Road in 3 consecutive games | Streaks |
| General | Hold Largest Army in 5 total games | Milestones |
| On a Roll | Win 3 games in a row | Streaks |
| Home Advantage | Win 5 games at the same location | Location |
| Nemesis Slayer | Beat your current Nemesis player | Head-to-Head |
| Point Machine | Score 12 or more points in a single game | Records |
| Seasoned Traveler | Play with all available expansions | Milestones |

### 5.7 Activity Feed

A social timeline showing recent match activity across the platform. Each entry shows who played, where, who won, and the ELO changes per player. Keeps the social layer alive between game nights.

### 5.8 Personal Records

Highlighted personal bests on each player profile: highest points scored in a single game, longest win streak, highest ELO ever reached, and most games played in a single month.

### 5.9 Year in Review

An annual Spotify Wrapped-style summary per player. Includes: total games played, total hours at the table, most-used color, best win streak, biggest ELO swing in a single match, Nemesis of the year, and most-played location. Shareable as an image card.

> Scoped to **Version 2**.

---

## 6. API — Core CRUD Surfaces

| Resource | Endpoints | Notes |
|---|---|---|
| Players | GET, POST, GET/:id, PATCH/:id, DELETE/:id | Auth-gated; players manage their own profiles |
| Locations | GET, POST, GET/:id, PATCH/:id, DELETE/:id | Scoped to the owning player |
| Matches | GET, POST, GET/:id, PATCH/:id, DELETE/:id | Includes nested Match Players on creation |
| Match Players | Nested under Match | Created and updated as part of a Match |
| Expansions | GET, GET/:id | Read-only reference data seeded by system |
| Daily Maps | GET /today, GET /:date | Generated server-side; read-only |
| Map Generator | POST /generate | Returns a randomized board configuration |
| Achievements | GET, GET/:id | Read-only achievement definitions |
| Player Achievements | GET /players/:id/achievements | Auto-awarded; not user-created |
| Rating History | GET /players/:id/ratings | Read-only; written by match logic |
| Leaderboard | GET /leaderboard | Ranked list of all players by ELO |
| Player Stats | GET /players/:id/stats | Computed aggregate statistics per player |

---

## 7. V1 Scope vs. Later Versions

| Feature | V1 | Later |
|---|---|---|
| Simple match logging | ✅ | |
| Player profiles and CRUD | ✅ | |
| Location CRUD | ✅ | |
| ELO rating system | ✅ | |
| Basic and advanced player stats | ✅ | |
| Map generator with daily map | ✅ | |
| Activity feed | ✅ | |
| Achievements and badges | ✅ | |
| Head-to-head and Nemesis stats | ✅ | |
| Personal records | ✅ | |
| Year in Review | | V2 |
| Hardcore tracking (Botonera) | | V2 |
| Photo of final board | | V2 |
| Dice roll tracker | | V2 |
| Mobile native app | | V3 |
| Multi-group / leagues support | | V3 |
| Seasonal leaderboards | | V3 |

---

## 8. Open Questions

- **Authentication:** social login (Google/Apple) or email and password, or both?
- **ELO formula:** standard multiplayer adaptation or a custom implementation?
- **Who logs a match:** only the host, or any participant?
- **Match verification:** should other players confirm results, or is one person's log final?
- **Daily map:** does it support expansion board sizes (Seafarers) from day one?
- **Offline support:** should the Botonera work without an internet connection mid-game?

---

*End of Document*
