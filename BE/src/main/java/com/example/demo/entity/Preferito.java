package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/** Un preferito appartiene sempre a un utente: e' il proprietario che ne restringe letture e cancellazioni. */
@Entity
@Table(name = "preferiti",
        uniqueConstraints = @UniqueConstraint(columnNames = {"utente_id", "disco_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Preferito {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "utente_id", nullable = false)
    private Utente utente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "disco_id", nullable = false)
    private Disco disco;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime aggiuntoIl = LocalDateTime.now();
}
