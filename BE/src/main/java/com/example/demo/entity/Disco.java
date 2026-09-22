package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Articolo della vetrina. I campi pubblici finiscono in DiscoPubblicoResponse,
 * quelli riservati (pubblicato, prezzoAcquisto, fornitore) solo in DiscoAdminResponse.
 */
@Entity
@Table(name = "dischi")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Disco {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titolo;

    @Column(nullable = false)
    private String artista;

    private String genere;

    private Integer anno;

    @Column(length = 2000)
    private String descrizione;

    private String copertinaUrl;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal prezzoVendita;

    // ---------- Anteprima audio (pubblica) ----------

    /** File audio di 30 secondi, di solito un previewUrl di iTunes. */
    @Column(length = 500)
    private String anteprimaUrl;

    /** Titolo del brano dell'anteprima. */
    private String anteprimaBrano;

    /** Pagina del brano su Apple Music, da mostrare insieme all'anteprima. */
    @Column(length = 500)
    private String anteprimaLink;

    // ---------- Campi riservati all'amministratore ----------

    @Column(precision = 10, scale = 2)
    private BigDecimal prezzoAcquisto;

    private String fornitore;

    /** false = bozza, visibile solo all'amministratore. */
    @Column(nullable = false)
    @Builder.Default
    private boolean pubblicato = false;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime creatoIl = LocalDateTime.now();
}
