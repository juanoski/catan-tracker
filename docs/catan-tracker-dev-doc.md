# Catan Tracker
## Development Document
*Current implementation snapshot - April 24, 2026*

---

## Table of Contents
1. [Vision](#1-vision)
2. [Current Tech Stack](#2-current-tech-stack)
3. [Repository Structure](#3-repository-structure)
4. [Runtime Architecture](#4-runtime-architecture)
5. [Data Model](#5-data-model)
6. [Authentication and Security](#6-authentication-and-security)
7. [API Surface](#7-api-surface)
8. [Frontend Coverage](#8-frontend-coverage)
9. [Feature Status](#9-feature-status)
10. [Known Gaps and Follow-Ups](#10-known-gaps-and-follow-ups)

---

## 1. Vision

Catan Tracker is a web app for logging Catan matches, tracking player performance over time, and turning game night into something measurable and fun. The current codebase already supports the core loop:

- register or log in
- create and manage locations
- log matches
- update ELO automatically
- view a leaderboard and recent activity

The broader product vision still includes richer stats, more polished profile views, and more advanced map and social features, but this document reflects what is actually implemented in the repository today.

---

## 2. Current Tech Stack

### 2.1 Frontend

| Technology | Role |
|---|---|
| Vite | Build tool and local dev server |
| React 18 | UI framework |
| TypeScript | Type safety |
| React Router | Client-side routing |
| TanStack Query | Server state and caching |
| React Hook Form + Zod | Form state and validation |
| Tailwind CSS | Styling |
| Radix UI | Headless UI primitives |
| Axios | HTTP client |
| Sonner | Toast notifications |

### 2.2 Backend

| Technology | Role |
|---|---|
| Java 21 | Runtime |
| Spring Boot 3.4 | Application framework |
| Spring Web | REST API |
| Spring Data JPA | Persistence layer |
| Spring Security | Auth and request protection |
| PostgreSQL | Primary relational database |
| Flyway | Schema migrations and seed data |
| JJWT | JWT creation and validation |
| Lombok | Boilerplate reduction |

### 2.3 Infrastructure

| Technology | Role |
|---|---|
| Docker Compose | Local service orchestration |
| Postgres container | Database service |
| API container | Spring Boot app container |

Notes:

- The repository currently does not define a `web` Docker service.
- The frontend is expected to run separately with Vite during local development.

---

## 3. Repository Structure

```text
catan-tracker/
|-- api/                  # Spring Boot REST API
|   |-- src/main/java/
|   |-- src/main/resources/
|   |   |-- application.yml
|   |   `-- db/migration/
|   `-- Dockerfile
|-- web/                  # Vite + React frontend
|   |-- src/
|   `-- package.json
|-- docs/
|   |-- catan-entities.mermaid
|   |-- catan-entities-v2.mermaid
|   `-- catan-tracker-dev-doc.md
|-- docker-compose.yml
`-- .env.example
```

There is no shared package workspace in the current repository. Shared API types are maintained manually in the frontend under `web/src/types/api.ts`.

---

## 4. Runtime Architecture

### 4.1 Local Development

`docker-compose.yml` starts:

- `postgres` on port `5432`
- `api` on port `8080`

The frontend runs separately with Vite on port `5173` and proxies `/api` requests to `http://localhost:8080`.

### 4.2 Request Flow

Typical flow for the app:

1. The user authenticates with `/api/auth/register` or `/api/auth/login`.
2. The frontend stores the JWT token in `localStorage`.
3. Axios sends the token as `Authorization: Bearer <token>` on future requests.
4. Spring Security validates the token through a JWT filter.
5. Protected controllers execute business logic against PostgreSQL via JPA repositories.

### 4.3 Core Business Flow: Match Logging

Logging a match is the center of the current product:

1. A logged-in user submits match data with participating players and results.
2. The backend validates that exactly one player is marked as winner.
3. The backend creates the `match` row.
4. The backend computes new ELO ratings for all participants.
5. The backend writes `match_player` rows with per-player stats and ELO snapshots.
6. The backend updates each player's current ELO.
7. The backend appends `rating_history` rows.
8. The backend evaluates achievements after the match is saved.

---

## 5. Data Model

The database schema is defined through Flyway migrations and validated by Hibernate at startup.

### 5.1 Player

Represents an authenticated user and tracked participant.

| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| name | string | Display name |
| email | string | Unique login identifier |
| password_hash | string | BCrypt-hashed password |
| avatar_url | string nullable | Optional avatar URL |
| elo_rating | integer | Current ELO, default `1000` |
| created_at | timestamp | Creation timestamp |

### 5.2 Location

Named place where matches are played.

| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| owner_id | UUID | Player who owns the location |
| name | string | Location name |
| address | string nullable | Optional address |

### 5.3 Expansion

Seeded reference table for supported expansions.

Current seeded values:

- Base Game
- Cities and Knights
- Seafarers
- Traders and Barbarians
- Explorers and Pirates

### 5.4 Daily Map

Deterministic generated board configuration.

| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| map_date | date | Unique date for a stored daily map |
| seed | string | Seed used to generate the map |
| tile_config | JSONB | Terrain tile layout |
| number_config | JSONB | Number token layout |
| port_config | JSONB | Port layout |

### 5.5 Match

Top-level record for a played game.

| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| location_id | UUID | Match location |
| expansion_id | UUID | Expansion played |
| daily_map_id | UUID nullable | Optional linked daily map |
| created_by | UUID | Player who logged the match |
| played_at | timestamp | When the game was played |
| duration_minutes | integer nullable | Optional duration |
| deck_layout | string | `single` or `double` |
| notes | text nullable | Optional notes |
| created_at | timestamp | Creation timestamp |

### 5.6 Match Player

Per-player stats for a match.

| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| match_id | UUID | Parent match |
| player_id | UUID | Participating player |
| color | string | Chosen color |
| points | integer | Final score |
| winner | boolean | Exactly one should be true per match |
| longest_road | boolean | Whether the player held Longest Road |
| largest_army | boolean | Whether the player held Largest Army |
| elo_before | integer | ELO before match |
| elo_after | integer | ELO after match |

### 5.7 Rating History

Append-only log of ELO changes.

| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| player_id | UUID | Player affected |
| match_id | UUID | Match that triggered the change |
| elo_before | integer | Prior ELO |
| elo_after | integer | New ELO |
| delta | integer | Difference |
| recorded_at | timestamp | Logged timestamp |

### 5.8 Achievement

Seeded achievement definitions.

| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| name | string | Achievement name |
| description | string | Human-readable description |
| icon_name | string | Frontend icon key |
| category | string | Achievement grouping |
| criteria_type | string | Evaluation mode |
| criteria_value | string | Threshold or rule value |

### 5.9 Player Achievement

Tracks which achievements a player has unlocked.

| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| player_id | UUID | Player |
| achievement_id | UUID | Achievement |
| match_id | UUID nullable | Match that triggered unlock |
| unlocked_at | timestamp | Unlock time |

---

## 6. Authentication and Security

The backend uses stateless JWT authentication.

### Public routes

- `/api/auth/**`
- `GET /api/expansions/**`
- `GET /api/daily-maps/**`

### Protected routes

All other routes require a valid JWT.

### Current authorization rules

- Players can only update or delete their own player record.
- Location owners can only update or delete their own locations.
- Match deletion is intended to be limited to the user who created the match.

### Frontend auth behavior

- Auth state is stored in `localStorage`.
- The token is attached automatically by Axios.
- A `401` response clears local auth state and redirects the user to `/login`.

---

## 7. API Surface

This section describes the routes implemented by the current backend.

### 7.1 Auth

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Create a new account |
| POST | `/api/auth/login` | Log in and return JWT |

### 7.2 Players

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/players` | List players |
| GET | `/api/players/{id}` | Get one player |
| PATCH | `/api/players/{id}` | Update own profile |
| DELETE | `/api/players/{id}` | Delete own profile |

Notes:

- Player creation happens through auth registration, not through a standalone `POST /api/players`.

### 7.3 Locations

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/locations` | List all locations |
| GET | `/api/locations/{id}` | Get one location |
| POST | `/api/locations` | Create location |
| PATCH | `/api/locations/{id}` | Update owned location |
| DELETE | `/api/locations/{id}` | Delete owned location |

### 7.4 Matches

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/matches` | Paginated list of matches |
| GET | `/api/matches/{id}` | Get one match |
| POST | `/api/matches` | Create a match and update ELO |
| DELETE | `/api/matches/{id}` | Delete a match |

Notes:

- There is no `PATCH /api/matches/{id}` in the current code.
- Match players are created as part of the match payload.

### 7.5 Expansions

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/expansions` | List seeded expansions |
| GET | `/api/expansions/{id}` | Get one expansion |

### 7.6 Daily Maps

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/daily-maps/today` | Get or generate today's map |
| GET | `/api/daily-maps/{date}` | Get or generate a specific date's map |
| POST | `/api/daily-maps/generate` | Generate an ad hoc map |

Notes:

- `GET` daily map routes are public.
- `POST /api/daily-maps/generate` is protected by auth under the current security config.

### 7.7 Leaderboard

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/leaderboard` | Rank players by current ELO |

### 7.8 Player Stats

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/players/{playerId}/stats` | Aggregate stats for one player |

Current stats response includes:

- current ELO
- peak ELO
- total matches and total wins
- win rate and average points
- win rate by player count
- matches and wins by color
- favorite color
- Longest Road and Largest Army counts
- current and longest win streak
- highest single-game points
- nemesis and rival summaries

### 7.9 Rating History

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/players/{playerId}/ratings` | ELO change history |

### 7.10 Achievements

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/achievements` | List achievement definitions |
| GET | `/api/achievements/{id}` | Get one achievement |
| GET | `/api/players/{playerId}/achievements` | List a player's unlocked achievements |

---

## 8. Frontend Coverage

The frontend currently ships the following pages:

### Implemented pages

- Login
- Register
- Dashboard
- Log Match
- Locations

### Current dashboard behavior

The dashboard shows:

- the logged-in user's rank and ELO if available
- a leaderboard summary
- recent matches with per-player ELO changes

### Current match logging behavior

The match form supports:

- location selection
- expansion selection
- played date and time
- optional duration
- deck layout selection
- optional notes
- 2 to 6 players
- winner selection
- Longest Road and Largest Army flags
- per-player points

### Not yet surfaced in the frontend

These backend capabilities exist but do not currently have dedicated UI pages in the shipped frontend:

- player profile management beyond auth state
- player stats views
- rating history charts or pages
- achievements pages
- daily map exploration UI
- match detail pages

---

## 9. Feature Status

### Implemented in code

- JWT auth with register and login
- player persistence
- location CRUD
- match logging
- multiplayer ELO recalculation
- rating history logging
- leaderboard API
- aggregate player stats API
- achievement seeding and basic unlock flow
- deterministic daily map generation
- dashboard with recent matches and leaderboard

### Partially implemented

- Achievements:
  backend support exists, but some evaluation rules are simplified.
- Player statistics:
  useful aggregates exist, but the full product vision is broader than the current implementation.
- Daily maps:
  base board generation exists, but advanced rule toggles and share/export features are not present.

### Not implemented in the current codebase

- live match tracking or "Botonera"
- activity feed as a dedicated social timeline page
- year in review
- seasonal leaderboards
- multi-group or league support
- offline mode
- photo upload or final-board image capture
- dice roll tracking
- native mobile app

---

## 10. Known Gaps and Follow-Ups

This document now matches the repository more closely, but there are still product and engineering follow-ups worth keeping in mind.

### Documentation follow-ups

- The `.docx` version of the development doc may still be stale if it is meant to mirror this markdown file.
- Mermaid diagrams may need review to ensure they match the actual schema and current scope.

### Codebase follow-ups

- Match deletion likely needs deeper handling because match-related data also affects rating history, achievements, and player ELO state.
- Some achievement rules are intentionally simplified today and do not fully match the original product definitions.
- The frontend contains only part of the backend capability set.
- There is no Gradle wrapper checked into the repo, so backend setup currently depends on a local Gradle installation or containerized builds.

---

*End of Document*
