DELETE FROM player_achievement
WHERE achievement_id IN (
    SELECT id FROM achievement WHERE name = 'Nemesis Slayer'
);

DELETE FROM achievement
WHERE name = 'Nemesis Slayer';
