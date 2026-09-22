package com.example.demo.service;

import com.example.demo.dto.PreferitoResponse;
import com.example.demo.entity.Disco;
import com.example.demo.entity.Preferito;
import com.example.demo.entity.Utente;
import com.example.demo.exception.ApiException;
import com.example.demo.repository.DiscoRepository;
import com.example.demo.repository.PreferitoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Livello 3: il proprietario entra in ogni query.
 * Un preferito di un altro utente risponde 404, esattamente come uno inesistente:
 * cosi' non si scopre nemmeno che quell'id esiste.
 */
@Service
@RequiredArgsConstructor
public class PreferitoService {

    private final PreferitoRepository preferitoRepository;
    private final DiscoRepository discoRepository;

    @Transactional(readOnly = true)
    public List<PreferitoResponse> elenco(Utente utente) {
        return preferitoRepository.findDelProprietario(utente.getId()).stream()
                .map(PreferitoResponse::di)
                .toList();
    }

    @Transactional(readOnly = true)
    public PreferitoResponse dettaglio(Long id, Utente utente) {
        return preferitoRepository.findByIdDelProprietario(id, utente.getId())
                .map(PreferitoResponse::di)
                .orElseThrow(() -> ApiException.nonTrovato("Preferito non trovato"));
    }

    /** Si possono salvare solo dischi pubblicati: una bozza non esiste per chi non amministra. */
    @Transactional
    public PreferitoResponse aggiungi(Long discoId, Utente utente) {
        Disco disco = discoRepository.findByIdAndPubblicatoTrue(discoId)
                .orElseThrow(() -> ApiException.nonTrovato("Disco non trovato"));

        if (preferitoRepository.existsByUtenteIdAndDiscoId(utente.getId(), disco.getId())) {
            throw ApiException.conflitto("Disco gia' nei preferiti");
        }

        Preferito preferito = preferitoRepository.save(Preferito.builder()
                .utente(utente)
                .disco(disco)
                .build());
        return PreferitoResponse.di(preferito);
    }

    @Transactional
    public void rimuovi(Long id, Utente utente) {
        if (preferitoRepository.deleteByIdDelProprietario(id, utente.getId()) == 0) {
            throw ApiException.nonTrovato("Preferito non trovato");
        }
    }
}
