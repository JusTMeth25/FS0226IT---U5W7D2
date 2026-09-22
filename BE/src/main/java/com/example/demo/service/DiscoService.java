package com.example.demo.service;

import com.example.demo.dto.DiscoAdminResponse;
import com.example.demo.dto.DiscoPubblicoResponse;
import com.example.demo.dto.DiscoRequest;
import com.example.demo.dto.DiscoResponse;
import com.example.demo.entity.Disco;
import com.example.demo.exception.ApiException;
import com.example.demo.repository.DiscoRepository;
import com.example.demo.repository.PreferitoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DiscoService {

    private final DiscoRepository discoRepository;
    private final PreferitoRepository preferitoRepository;

    /**
     * Stesso indirizzo, due risposte: l'amministratore riceve tutti i dischi (bozze comprese)
     * con i campi riservati; tutti gli altri solo i pubblicati, con i soli campi pubblici.
     */
    @Transactional(readOnly = true)
    public List<DiscoResponse> elenco(boolean admin) {
        if (admin) {
            return discoRepository.findAllByOrderByTitoloAsc().stream()
                    .<DiscoResponse>map(DiscoAdminResponse::di)
                    .toList();
        }
        return discoRepository.findByPubblicatoTrueOrderByTitoloAsc().stream()
                .<DiscoResponse>map(DiscoPubblicoResponse::di)
                .toList();
    }

    /** Una bozza chiesta da chi non amministra risponde 404, come se non esistesse. */
    @Transactional(readOnly = true)
    public DiscoResponse dettaglio(Long id, boolean admin) {
        if (admin) {
            return DiscoAdminResponse.di(trova(id));
        }
        return discoRepository.findByIdAndPubblicatoTrue(id)
                .map(DiscoPubblicoResponse::di)
                .orElseThrow(() -> ApiException.nonTrovato("Disco non trovato"));
    }

    @Transactional
    public DiscoAdminResponse crea(DiscoRequest richiesta) {
        Disco disco = new Disco();
        applica(disco, richiesta);
        return DiscoAdminResponse.di(discoRepository.save(disco));
    }

    @Transactional
    public DiscoAdminResponse aggiorna(Long id, DiscoRequest richiesta) {
        Disco disco = trova(id);
        applica(disco, richiesta);
        return DiscoAdminResponse.di(disco);
    }

    @Transactional
    public DiscoAdminResponse cambiaPubblicazione(Long id, boolean pubblicato) {
        Disco disco = trova(id);
        disco.setPubblicato(pubblicato);
        return DiscoAdminResponse.di(disco);
    }

    @Transactional
    public void elimina(Long id) {
        Disco disco = trova(id);
        preferitoRepository.deleteByDiscoId(disco.getId());
        discoRepository.delete(disco);
    }

    private Disco trova(Long id) {
        return discoRepository.findById(id)
                .orElseThrow(() -> ApiException.nonTrovato("Disco non trovato"));
    }

    private static String vuotoANull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    private void applica(Disco disco, DiscoRequest r) {
        disco.setTitolo(r.titolo().trim());
        disco.setArtista(r.artista().trim());
        disco.setGenere(r.genere());
        disco.setAnno(r.anno());
        disco.setDescrizione(r.descrizione());
        disco.setCopertinaUrl(r.copertinaUrl());
        disco.setPrezzoVendita(r.prezzoVendita());
        disco.setAnteprimaUrl(vuotoANull(r.anteprimaUrl()));
        disco.setAnteprimaBrano(vuotoANull(r.anteprimaBrano()));
        disco.setAnteprimaLink(vuotoANull(r.anteprimaLink()));
        disco.setPrezzoAcquisto(r.prezzoAcquisto());
        disco.setFornitore(r.fornitore());
        disco.setPubblicato(Boolean.TRUE.equals(r.pubblicato()));
    }
}
