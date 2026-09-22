package com.example.demo.dto;

import com.example.demo.entity.Utente;
import com.example.demo.enums.Ruolo;

public record UtenteResponse(Long id, String nome, String email, Ruolo ruolo) {

    public static UtenteResponse di(Utente u) {
        return new UtenteResponse(u.getId(), u.getNome(), u.getEmail(), u.getRuolo());
    }
}
