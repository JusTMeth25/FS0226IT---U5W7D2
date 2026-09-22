package com.example.demo.controller;

import com.example.demo.dto.DiscoAdminResponse;
import com.example.demo.dto.DiscoRequest;
import com.example.demo.dto.DiscoResponse;
import com.example.demo.service.DiscoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dischi")
@RequiredArgsConstructor
public class DiscoController {

    private final DiscoService discoService;

    // ---------- Lettura: pubblica (livello 1), ma la risposta dipende dal ruolo ----------

    @GetMapping
    public List<DiscoResponse> elenco(Authentication auth) {
        return discoService.elenco(isAdmin(auth));
    }

    @GetMapping("/{id}")
    public DiscoResponse dettaglio(@PathVariable Long id, Authentication auth) {
        return discoService.dettaglio(id, isAdmin(auth));
    }

    // ---------- Scrittura: riservata all'amministratore (livello 2) ----------

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public DiscoAdminResponse crea(@Valid @RequestBody DiscoRequest richiesta) {
        return discoService.crea(richiesta);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public DiscoAdminResponse aggiorna(@PathVariable Long id, @Valid @RequestBody DiscoRequest richiesta) {
        return discoService.aggiorna(id, richiesta);
    }

    /** Pubblica o riporta in bozza: PATCH /api/dischi/5/pubblicazione?pubblicato=true */
    @PatchMapping("/{id}/pubblicazione")
    @PreAuthorize("hasRole('ADMIN')")
    public DiscoAdminResponse cambiaPubblicazione(@PathVariable Long id, @RequestParam boolean pubblicato) {
        return discoService.cambiaPubblicazione(id, pubblicato);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void elimina(@PathVariable Long id) {
        discoService.elimina(id);
    }

    /** Per un visitatore anonimo Spring passa auth = null. */
    private boolean isAdmin(Authentication auth) {
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }
}
