package com.example.demo.config;

import com.example.demo.entity.Disco;
import com.example.demo.entity.Utente;
import com.example.demo.enums.Ruolo;
import com.example.demo.repository.DiscoRepository;
import com.example.demo.repository.UtenteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * All'avvio crea l'amministratore (non esiste un endpoint per diventarlo)
 * e, se la vetrina e' vuota, qualche disco di esempio tra pubblicati e bozze.
 */
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private static final String IMG = "https://upload.wikimedia.org/wikipedia/";

    private final UtenteRepository utenteRepository;
    private final DiscoRepository discoRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email}")
    private String adminEmail;

    @Value("${app.admin.password}")
    private String adminPassword;

    @Override
    @Transactional
    public void run(String... args) {
        creaAdmin();
        creaDischiEsempio();
    }

    private void creaAdmin() {
        String email = adminEmail.trim().toLowerCase();
        if (utenteRepository.existsByEmail(email)) {
            return;
        }
        utenteRepository.save(Utente.builder()
                .nome("Amministratore")
                .email(email)
                .password(passwordEncoder.encode(adminPassword))
                .ruolo(Ruolo.ADMIN)
                .build());
    }

    private void creaDischiEsempio() {
        if (discoRepository.count() > 0) {
            return;
        }
        discoRepository.saveAll(List.of(
                disco("Kind of Blue", "Miles Davis", "Jazz", 1959,
                        "Il disco jazz piu' venduto di sempre, registrato in due sessioni quasi senza prove.",
                        IMG + "en/1/10/Miles_Davis_-_Kind_of_Blue_album_cover.jpg",
                        "29.90", "14.50", "Sony Music Distribuzione", true),
                disco("The Dark Side of the Moon", "Pink Floyd", "Rock", 1973,
                        "Concept album su tempo, denaro e follia. Un prisma, un raggio, cinquant'anni di classifica.",
                        IMG + "commons/3/3b/Dark_Side_of_the_Moon.png",
                        "34.90", "17.00", "Warner Music Italia", true),
                disco("Rumours", "Fleetwood Mac", "Rock", 1977,
                        "Scritto mentre la band si separava, suona come una festa.",
                        IMG + "en/f/fb/FMacRumours.PNG",
                        "27.50", "13.20", "Warner Music Italia", true),
                disco("Blue Train", "John Coltrane", "Jazz", 1957,
                        "Unico disco di Coltrane da leader per la Blue Note.",
                        IMG + "commons/6/68/John_Coltrane_-_Blue_Train.jpg",
                        "31.00", "15.80", "Universal Music Italia", true),
                disco("Unknown Pleasures", "Joy Division", "Post-punk", 1979,
                        "Le onde radio di una pulsar diventate la copertina piu' copiata di sempre.",
                        IMG + "en/5/5a/UnknownPleasuresVinyl.jpg",
                        "28.00", "12.40", "Universal Music Italia", true),
                disco("Discovery", "Daft Punk", "Elettronica", 2001,
                        "Filtri, vocoder e campionamenti: la house francese in versione cartone animato.",
                        IMG + "en/b/b7/DaftPunkDiscovery.jpg",
                        "36.90", "19.10", "Sony Music Distribuzione", true),
                disco("Mezzanine", "Massive Attack", "Trip hop", 1998,
                        "Bassi profondi e chitarre scure: Bristol alle tre di notte.",
                        IMG + "en/e/e9/Massive_Attack_-_Mezzanine.png",
                        "33.50", "16.70", "Universal Music Italia", true),
                disco("Blue", "Joni Mitchell", "Cantautorato", 1971,
                        "Dieci canzoni scritte a nervi scoperti, voce e dulcimer.",
                        IMG + "en/e/e1/Bluealbumcover.jpg",
                        "26.00", "11.90", "Warner Music Italia", true),
                disco("Nevermind", "Nirvana", "Grunge", 1991,
                        "Il disco che ha spinto Michael Jackson giu' dalla vetta di Billboard.",
                        IMG + "en/b/b7/NirvanaNevermindalbumcover.jpg",
                        "25.90", "11.00", "Universal Music Italia", true),
                disco("Anima Latina", "Lucio Battisti", "Cantautorato", 1974,
                        "Ristampa in arrivo: scheda ancora in preparazione.",
                        IMG + "en/6/64/Lucio_Battisti_-_Anima_latina.jpg",
                        "32.00", "18.40", "Sony Music Distribuzione", false),
                disco("Remain in Light", "Talking Heads", "New wave", 1980,
                        "Bozza: manca ancora la descrizione definitiva.",
                        IMG + "en/2/2d/TalkingHeadsRemaininLight.jpg",
                        "26.90", "12.90", "Warner Music Italia", false),
                disco("Random Access Memories", "Daft Punk", "Elettronica", 2013,
                        "Bozza: in attesa della ristampa 10th anniversary.",
                        IMG + "en/2/26/Daft_Punk_-_Random_Access_Memories.png",
                        "39.90", "21.30", "Sony Music Distribuzione", false)
        ));
    }

    private Disco disco(String titolo, String artista, String genere, int anno, String descrizione,
                        String copertinaUrl, String prezzoVendita, String prezzoAcquisto,
                        String fornitore, boolean pubblicato) {
        return Disco.builder()
                .titolo(titolo)
                .artista(artista)
                .genere(genere)
                .anno(anno)
                .descrizione(descrizione)
                .copertinaUrl(copertinaUrl)
                .prezzoVendita(new BigDecimal(prezzoVendita))
                .prezzoAcquisto(new BigDecimal(prezzoAcquisto))
                .fornitore(fornitore)
                .pubblicato(pubblicato)
                .build();
    }
}
