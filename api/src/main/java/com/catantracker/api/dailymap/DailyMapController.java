package com.catantracker.api.dailymap;

import com.catantracker.api.dailymap.dto.DailyMapResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/daily-maps")
@RequiredArgsConstructor
public class DailyMapController {

    private final DailyMapService dailyMapService;

    @GetMapping("/today")
    public DailyMapResponse getToday() {
        return dailyMapService.getOrGenerateForDate(LocalDate.now());
    }

    @GetMapping("/{date}")
    public DailyMapResponse getByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return dailyMapService.getOrGenerateForDate(date);
    }

    @PostMapping("/generate")
    public DailyMapResponse generate() {
        return dailyMapService.generate();
    }
}
