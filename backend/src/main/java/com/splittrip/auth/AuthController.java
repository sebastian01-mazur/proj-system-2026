package com.splittrip.auth;

import com.splittrip.auth.dto.AuthResponse;
import com.splittrip.auth.dto.LoginRequest;
import com.splittrip.auth.dto.RegisterRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import com.splittrip.auth.dto.OAuthCallbackRequest;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin
public class AuthController {
    //Obsługuje punkty wejścia dla rejestracji, logowania standardowego, callbacku OAuth oraz wylogowania.
    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(authService.register(request));
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {

        return authService.login(request);
    }
    @PostMapping("/oauth/callback")
    public ResponseEntity<AuthResponse> oauthCallback(
            @RequestBody OAuthCallbackRequest request) {

        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED)
                .build();
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {

        return ResponseEntity.ok().build();
    }
}
