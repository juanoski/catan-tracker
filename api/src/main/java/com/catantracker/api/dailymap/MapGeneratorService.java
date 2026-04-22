package com.catantracker.api.dailymap;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class MapGeneratorService {

    private final ObjectMapper objectMapper;

    // Standard 3-4 player Catan board positions in axial coordinates (q, r)
    private static final int[][] LAND_POSITIONS = {
            {-2, 0}, {-2, 1}, {-2, 2},
            {-1, -1}, {-1, 0}, {-1, 1}, {-1, 2},
            {0, -2}, {0, -1}, {0, 0}, {0, 1}, {0, 2},
            {1, -2}, {1, -1}, {1, 0}, {1, 1},
            {2, -2}, {2, -1}, {2, 0}
    };

    // Port positions: {q, r, direction} where direction is which edge faces the sea
    private static final int[][] PORT_POSITIONS = {
            {-2, 0, 5}, {-2, 2, 0}, {0, -2, 1}, {0, 2, 3},
            {2, -2, 2}, {2, 0, 3}, {1, 2, 4}, {-1, -1, 5}, {1, -2, 1}
    };

    private static final List<String> TERRAIN_TILES = List.of(
            "fields", "fields", "fields", "fields",
            "forest", "forest", "forest", "forest",
            "pasture", "pasture", "pasture", "pasture",
            "hills", "hills", "hills",
            "mountains", "mountains", "mountains",
            "desert"
    );

    private static final List<Integer> NUMBER_TOKENS = List.of(
            2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12
    );

    private static final List<String> PORT_TYPES = List.of(
            "3:1", "3:1", "3:1", "3:1",
            "grain", "lumber", "wool", "brick", "ore"
    );

    public GeneratedMap generate(long seed) {
        Random rng = new Random(seed);

        List<String> terrains = new ArrayList<>(TERRAIN_TILES);
        Collections.shuffle(terrains, rng);

        List<Integer> numbers = new ArrayList<>(NUMBER_TOKENS);
        Collections.shuffle(numbers, rng);

        List<String> ports = new ArrayList<>(PORT_TYPES);
        Collections.shuffle(ports, rng);

        List<Map<String, Object>> tileConfig = new ArrayList<>();
        List<Map<String, Object>> numberConfig = new ArrayList<>();
        int numberIndex = 0;

        for (int i = 0; i < LAND_POSITIONS.length; i++) {
            String terrain = terrains.get(i);
            Map<String, Object> tile = new LinkedHashMap<>();
            tile.put("q", LAND_POSITIONS[i][0]);
            tile.put("r", LAND_POSITIONS[i][1]);
            tile.put("terrain", terrain);
            tileConfig.add(tile);

            if (!terrain.equals("desert")) {
                Map<String, Object> num = new LinkedHashMap<>();
                num.put("q", LAND_POSITIONS[i][0]);
                num.put("r", LAND_POSITIONS[i][1]);
                num.put("number", numbers.get(numberIndex++));
                numberConfig.add(num);
            }
        }

        List<Map<String, Object>> portConfig = new ArrayList<>();
        for (int i = 0; i < PORT_POSITIONS.length; i++) {
            Map<String, Object> port = new LinkedHashMap<>();
            port.put("q", PORT_POSITIONS[i][0]);
            port.put("r", PORT_POSITIONS[i][1]);
            port.put("direction", PORT_POSITIONS[i][2]);
            port.put("type", ports.get(i));
            portConfig.add(port);
        }

        try {
            return new GeneratedMap(
                    objectMapper.writeValueAsString(tileConfig),
                    objectMapper.writeValueAsString(numberConfig),
                    objectMapper.writeValueAsString(portConfig)
            );
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize map", e);
        }
    }

    public record GeneratedMap(String tileConfig, String numberConfig, String portConfig) {}
}
