package com.example.demo.dto;

import com.example.demo.entity.Disco;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Vista completa per l'amministratore, con i campi riservati. */
public record DiscoAdminResponse(
        Long id,
        String titolo,
        String artista,
        String genere,
        Integer anno,
        String descrizione,
        String copertinaUrl,
        BigDecimal prezzoVendita,
        String anteprimaUrl,
        String anteprimaBrano,
        String anteprimaLink,
        BigDecimal prezzoAcquisto,
        String fornitore,
        boolean pubblicato,
        LocalDateTime creatoIl
) implements DiscoResponse {

    public static DiscoAdminResponse di(Disco d) {
        return new DiscoAdminResponse(d.getId(), d.getTitolo(), d.getArtista(), d.getGenere(),
                d.getAnno(), d.getDescrizione(), d.getCopertinaUrl(), d.getPrezzoVendita(),
                d.getAnteprimaUrl(), d.getAnteprimaBrano(), d.getAnteprimaLink(),
                d.getPrezzoAcquisto(), d.getFornitore(), d.isPubblicato(), d.getCreatoIl());
    }
}
