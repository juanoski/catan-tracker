CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE player (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url    VARCHAR(500),
    elo_rating    INTEGER      NOT NULL DEFAULT 1000,
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE location (
    id       UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID         NOT NULL REFERENCES player(id),
    name     VARCHAR(100) NOT NULL,
    address  VARCHAR(255)
);

CREATE TABLE expansion (
    id   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE daily_map (
    id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    map_date      DATE    NOT NULL UNIQUE,
    seed          VARCHAR(100) NOT NULL,
    tile_config   JSONB   NOT NULL,
    number_config JSONB   NOT NULL,
    port_config   JSONB   NOT NULL
);

CREATE TABLE match (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id      UUID        NOT NULL REFERENCES location(id),
    expansion_id     UUID        NOT NULL REFERENCES expansion(id),
    daily_map_id     UUID        REFERENCES daily_map(id),
    created_by       UUID        NOT NULL REFERENCES player(id),
    played_at        TIMESTAMP   NOT NULL,
    duration_minutes INTEGER,
    deck_layout      VARCHAR(20) NOT NULL DEFAULT 'single',
    notes            TEXT,
    created_at       TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE TABLE match_player (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id     UUID        NOT NULL REFERENCES match(id) ON DELETE CASCADE,
    player_id    UUID        NOT NULL REFERENCES player(id),
    color        VARCHAR(50) NOT NULL,
    points       INTEGER     NOT NULL DEFAULT 0,
    winner       BOOLEAN     NOT NULL DEFAULT FALSE,
    longest_road BOOLEAN     NOT NULL DEFAULT FALSE,
    largest_army BOOLEAN     NOT NULL DEFAULT FALSE,
    elo_before   INTEGER     NOT NULL,
    elo_after    INTEGER     NOT NULL,
    UNIQUE (match_id, player_id)
);

CREATE TABLE rating_history (
    id          UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id   UUID      NOT NULL REFERENCES player(id),
    match_id    UUID      NOT NULL REFERENCES match(id),
    elo_before  INTEGER   NOT NULL,
    elo_after   INTEGER   NOT NULL,
    delta       INTEGER   NOT NULL,
    recorded_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE achievement (
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name           VARCHAR(100) NOT NULL UNIQUE,
    description    TEXT         NOT NULL,
    icon_name      VARCHAR(100) NOT NULL,
    category       VARCHAR(50)  NOT NULL,
    criteria_type  VARCHAR(100) NOT NULL,
    criteria_value VARCHAR(255) NOT NULL
);

CREATE TABLE player_achievement (
    id             UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id      UUID      NOT NULL REFERENCES player(id),
    achievement_id UUID      NOT NULL REFERENCES achievement(id),
    match_id       UUID      REFERENCES match(id),
    unlocked_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (player_id, achievement_id)
);

CREATE INDEX idx_match_player_player_id      ON match_player(player_id);
CREATE INDEX idx_match_player_match_id       ON match_player(match_id);
CREATE INDEX idx_rating_history_player_id    ON rating_history(player_id);
CREATE INDEX idx_player_achievement_player   ON player_achievement(player_id);
CREATE INDEX idx_match_played_at             ON match(played_at DESC);
CREATE INDEX idx_match_created_by            ON match(created_by);
