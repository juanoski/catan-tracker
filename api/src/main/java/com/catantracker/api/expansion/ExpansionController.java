package com.catantracker.api.expansion;

import com.catantracker.api.exception.ApiException;
import com.catantracker.api.expansion.dto.ExpansionResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/expansions")
@RequiredArgsConstructor
public class ExpansionController {

    private final ExpansionRepository expansionRepository;

    @GetMapping
    public List<ExpansionResponse> getAll() {
        return expansionRepository.findAll().stream().map(ExpansionResponse::from).toList();
    }

    @GetMapping("/{id}")
    public ExpansionResponse getById(@PathVariable UUID id) {
        return expansionRepository.findById(id)
                .map(ExpansionResponse::from)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Expansion not found"));
    }
}
