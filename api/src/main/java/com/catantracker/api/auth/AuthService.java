package com.catantracker.api.auth;

import com.catantracker.api.auth.dto.AuthResponse;
import com.catantracker.api.auth.dto.LoginRequest;
import com.catantracker.api.auth.dto.RegisterRequest;
import com.catantracker.api.exception.ApiException;
import com.catantracker.api.player.Player;
import com.catantracker.api.player.PlayerRole;
import com.catantracker.api.player.PlayerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final PlayerRepository playerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (playerRepository.existsByEmail(req.email())) {
            throw new ApiException(HttpStatus.CONFLICT, "Email already registered");
        }
        Player player = Player.builder()
                .name(req.name())
                .email(req.email())
                .passwordHash(passwordEncoder.encode(req.password()))
                .role(PlayerRole.PLAYER)
                .build();
        playerRepository.save(player);
        String token = jwtService.generateToken(player.getId(), player.getEmail());
        return new AuthResponse(token, player.getId(), player.getName(), player.getEmail(), player.getRole());
    }

    public AuthResponse login(LoginRequest req) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.email(), req.password()));
        Player player = playerRepository.findByEmail(req.email())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
        String token = jwtService.generateToken(player.getId(), player.getEmail());
        return new AuthResponse(token, player.getId(), player.getName(), player.getEmail(), player.getRole());
    }
}
