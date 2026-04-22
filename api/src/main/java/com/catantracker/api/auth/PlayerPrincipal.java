package com.catantracker.api.auth;

import com.catantracker.api.player.Player;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@RequiredArgsConstructor
public class PlayerPrincipal implements UserDetails {

    @Getter
    private final Player player;

    public UUID getId() {
        return player.getId();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of();
    }

    @Override
    public String getPassword() {
        return player.getPasswordHash();
    }

    @Override
    public String getUsername() {
        return player.getEmail();
    }
}
