package com.catantracker.api.auth;

import com.catantracker.api.player.PlayerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final PlayerRepository playerRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return playerRepository.findByEmail(email)
                .map(PlayerPrincipal::new)
                .orElseThrow(() -> new UsernameNotFoundException("Player not found: " + email));
    }
}
