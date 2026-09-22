package com.example.demo.controller;

import com.example.demo.dto.AuthResponse;
import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.RegistrazioneRequest;
import com.example.demo.dto.UtenteResponse;
import com.example.demo.entity.Utente;
import com.example.demo.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/registrazione")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse registrazione(@Valid @RequestBody RegistrazioneRequest richiesta) {
        return authService.registra(richiesta);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest richiesta) {
        return authService.login(richiesta);
    }

    /** Protetto dalla catena dei filtri (anyRequest().authenticated()). */
    @GetMapping("/me")
    public UtenteResponse me(@AuthenticationPrincipal Utente utente) {
        return UtenteResponse.di(utente);
    }
}
