package com.example.demo.dto;

import com.example.demo.entity.Preferito;

import java.time.LocalDateTime;

/** Anche dentro i preferiti il disco esce nella sola vista pubblica. */
public record PreferitoResponse(
        Long id,
        LocalDateTime aggiuntoIl,
        DiscoPubblicoResponse disco
) {
    public static PreferitoResponse di(Preferito p) {
        return new PreferitoResponse(p.getId(), p.getAggiuntoIl(), DiscoPubblicoResponse.di(p.getDisco()));
    }
}
