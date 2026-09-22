package com.example.demo.dto;

import com.example.demo.entity.Utente;

public record AuthResponse(String token, String tipo, UtenteResponse utente) {

    public static AuthResponse di(String token, Utente u) {
        return new AuthResponse(token, "Bearer", UtenteResponse.di(u));
    }
}
