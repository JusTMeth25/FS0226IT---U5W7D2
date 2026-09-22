package com.example.demo.service;

import com.example.demo.dto.AuthResponse;
import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.RegistrazioneRequest;
import com.example.demo.entity.Utente;
import com.example.demo.enums.Ruolo;
import com.example.demo.exception.ApiException;
import com.example.demo.repository.UtenteRepository;
import com.example.demo.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UtenteRepository utenteRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    /** La registrazione crea sempre un USER: il ruolo non si sceglie dal client. */
    @Transactional
    public AuthResponse registra(RegistrazioneRequest richiesta) {
        String email = richiesta.email().trim().toLowerCase();
        if (utenteRepository.existsByEmail(email)) {
            throw ApiException.conflitto("Email gia' registrata");
        }

        Utente utente = utenteRepository.save(Utente.builder()
                .nome(richiesta.nome().trim())
                .email(email)
                .password(passwordEncoder.encode(richiesta.password()))
                .ruolo(Ruolo.USER)
                .build());

        return AuthResponse.di(jwtService.generaToken(utente.getEmail()), utente);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest richiesta) {
        Utente utente = utenteRepository.findByEmail(richiesta.email().trim().toLowerCase())
                .filter(u -> passwordEncoder.matches(richiesta.password(), u.getPassword()))
                // Stesso messaggio per email e password sbagliate: non rivela quali email esistono
                .orElseThrow(() -> ApiException.nonAutorizzato("Credenziali non valide"));

        return AuthResponse.di(jwtService.generaToken(utente.getEmail()), utente);
    }
}
