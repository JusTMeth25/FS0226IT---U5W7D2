package com.example.demo.dto;

import com.example.demo.entity.Disco;

import java.math.BigDecimal;

/** Solo i campi che spettano al pubblico: niente bozze, prezzo d'acquisto o fornitore. */
public record DiscoPubblicoResponse(
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
        String anteprimaLink
) implements DiscoResponse {

    public static DiscoPubblicoResponse di(Disco d) {
        return new DiscoPubblicoResponse(d.getId(), d.getTitolo(), d.getArtista(), d.getGenere(),
                d.getAnno(), d.getDescrizione(), d.getCopertinaUrl(), d.getPrezzoVendita(),
                d.getAnteprimaUrl(), d.getAnteprimaBrano(), d.getAnteprimaLink());
    }
}
