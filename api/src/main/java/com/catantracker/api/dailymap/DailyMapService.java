package com.catantracker.api.dailymap;

import com.catantracker.api.dailymap.dto.DailyMapResponse;
import com.catantracker.api.exception.ApiException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DailyMapService {

    private final DailyMapRepository dailyMapRepository;
    private final MapGeneratorService mapGeneratorService;
    private final ObjectMapper objectMapper;

    @Transactional
    public DailyMapResponse getOrGenerateForDate(LocalDate date) {
        return dailyMapRepository.findByMapDate(date)
                .map(m -> DailyMapResponse.from(m, objectMapper))
                .orElseGet(() -> DailyMapResponse.from(generateAndSave(date), objectMapper));
    }

    public DailyMapResponse generate() {
        long seed = System.currentTimeMillis();
        MapGeneratorService.GeneratedMap generated = mapGeneratorService.generate(seed);
        DailyMap map = DailyMap.builder()
                .mapDate(null)
                .seed(String.valueOf(seed))
                .tileConfig(generated.tileConfig())
                .numberConfig(generated.numberConfig())
                .portConfig(generated.portConfig())
                .build();
        return DailyMapResponse.from(map, objectMapper);
    }

    public DailyMapResponse findById(UUID id) {
        return dailyMapRepository.findById(id)
                .map(m -> DailyMapResponse.from(m, objectMapper))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Map not found"));
    }

    public DailyMap getEntityById(UUID id) {
        return dailyMapRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Map not found"));
    }

    private DailyMap generateAndSave(LocalDate date) {
        long seed = date.toEpochDay();
        MapGeneratorService.GeneratedMap generated = mapGeneratorService.generate(seed);
        DailyMap map = DailyMap.builder()
                .mapDate(date)
                .seed(String.valueOf(seed))
                .tileConfig(generated.tileConfig())
                .numberConfig(generated.numberConfig())
                .portConfig(generated.portConfig())
                .build();
        return dailyMapRepository.save(map);
    }
}
