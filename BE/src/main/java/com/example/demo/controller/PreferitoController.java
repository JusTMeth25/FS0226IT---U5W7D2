package com.example.demo.controller;

import com.example.demo.dto.PreferitoRequest;
import com.example.demo.dto.PreferitoResponse;
import com.example.demo.entity.Utente;
import com.example.demo.service.PreferitoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Livello 1: la catena dei filtri richiede un utente collegato.
 * Livello 3: il service passa sempre l'utente alle query, quindi ognuno vede e cancella solo i propri.
 * Il proprietario arriva dal token, mai dal body o dall'URL.
 */
@RestController
@RequestMapping("/api/preferiti")
@RequiredArgsConstructor
public class PreferitoController {

    private final PreferitoService preferitoService;

    @GetMapping
    public List<PreferitoResponse> elenco(@AuthenticationPrincipal Utente utente) {
        return preferitoService.elenco(utente);
    }

    @GetMapping("/{id}")
    public PreferitoResponse dettaglio(@PathVariable Long id, @AuthenticationPrincipal Utente utente) {
        return preferitoService.dettaglio(id, utente);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PreferitoResponse aggiungi(@Valid @RequestBody PreferitoRequest richiesta,
                                      @AuthenticationPrincipal Utente utente) {
        return preferitoService.aggiungi(richiesta.discoId(), utente);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void rimuovi(@PathVariable Long id, @AuthenticationPrincipal Utente utente) {
        preferitoService.rimuovi(id, utente);
    }
}
