INSERT INTO achievement (name, description, icon_name, category, criteria_type, criteria_value) VALUES
    ('First Blood',       'Win your first match',                          'trophy',   'milestones',   'WIN_COUNT',           '1'),
    ('On a Roll',         'Win 3 games in a row',                          'fire',     'streaks',      'WIN_STREAK',          '3'),
    ('Unstoppable',       'Win 5 games in a row',                          'lightning','streaks',      'WIN_STREAK',          '5'),
    ('Road King',         'Hold Longest Road in 3 consecutive games',      'road',     'streaks',      'LONGEST_ROAD_STREAK', '3'),
    ('General',           'Hold Largest Army in 5 total games',            'shield',   'milestones',   'LARGEST_ARMY_COUNT',  '5'),
    ('Color Collector',   'Win a game with every available color',         'palette',  'colors',       'ALL_COLORS_WIN',      '1'),
    ('Home Advantage',    'Win 5 games at the same location',              'home',     'location',     'LOCATION_WIN_COUNT',  '5'),
    ('Nemesis Slayer',    'Beat your current Nemesis player',              'sword',    'head-to-head', 'BEAT_NEMESIS',        '1'),
    ('Point Machine',     'Score 12 or more points in a single game',      'star',     'records',      'SINGLE_GAME_POINTS',  '12'),
    ('Seasoned Traveler', 'Play with all available expansions',            'map',      'milestones',   'ALL_EXPANSIONS',      '1'),
    ('Veteran',           'Play 50 total matches',                         'badge',    'milestones',   'MATCH_COUNT',         '50'),
    ('Century',           'Play 100 total matches',                        'medal',    'milestones',   'MATCH_COUNT',         '100');
