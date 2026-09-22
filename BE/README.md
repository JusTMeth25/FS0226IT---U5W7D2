# Vetrina Dischi — Backend (U5W7D2)

Sito vetrina di dischi in vinile con tre livelli di accesso: visitatore anonimo, utente registrato, amministratore.
Stessi indirizzi, risposte diverse: è il server a decidere chi vede che cosa.

## Avvio

Requisiti: Java 25, PostgreSQL con il database `U5W7D2` (utente `postgres`, password `1234`).

```bash
./mvnw spring-boot:run
```

Le tabelle vengono create da Hibernate (`ddl-auto=update`). Al primo avvio `DataInitializer` crea:

- l'amministratore `admin@vetrina.it` / `admin1234` (non esiste un endpoint per diventare admin);
- 12 dischi di esempio: 9 pubblicati e 3 in bozza (copertine da Wikimedia).

Il frontend è atteso su `http://localhost:5173` (CORS).

## Endpoint

| Metodo | Indirizzo | Chi | Note |
|---|---|---|---|
| POST | `/api/auth/registrazione` | tutti | crea sempre un `USER`, restituisce il token |
| POST | `/api/auth/login` | tutti | restituisce il token |
| GET | `/api/auth/me` | loggato | dati dell'utente corrente |
| GET | `/api/dischi` | tutti | anonimo/USER: solo pubblicati, campi pubblici. ADMIN: tutti, campi riservati |
| GET | `/api/dischi/{id}` | tutti | una bozza risponde 404 a chi non è admin |
| POST | `/api/dischi` | ADMIN | crea un disco (pubblicato o bozza) |
| PUT | `/api/dischi/{id}` | ADMIN | modifica |
| PATCH | `/api/dischi/{id}/pubblicazione?pubblicato=true` | ADMIN | pubblica / riporta in bozza |
| DELETE | `/api/dischi/{id}` | ADMIN | elimina (e i preferiti collegati) |
| GET | `/api/preferiti` | loggato | solo i propri |
| GET | `/api/preferiti/{id}` | loggato | solo se è proprio, altrimenti 404 |
| POST | `/api/preferiti` | loggato | body `{ "discoId": 1 }`, solo dischi pubblicati |
| DELETE | `/api/preferiti/{id}` | loggato | solo se è proprio, altrimenti 404 |

Autenticazione: header `Authorization: Bearer <token>`.

**Campi pubblici** (`DiscoPubblicoResponse`): id, titolo, artista, genere, anno, descrizione, copertinaUrl, prezzoVendita, anteprimaUrl, anteprimaBrano, anteprimaLink.

**Anteprima audio**: `anteprimaUrl` (file di 30 s, di solito da iTunes), `anteprimaBrano` e `anteprimaLink` (pagina Apple Music).
Sono campi pubblici e opzionali; li imposta l'admin. Gli URL devono essere `https://`, altrimenti 400.
**Campi riservati** (solo `DiscoAdminResponse`): prezzoAcquisto, fornitore, pubblicato, creatoIl.

## Relazione: quale livello protegge quale indirizzo

### Livello 1 — Catena dei filtri (`config/SecurityConfig.java`)

Ragiona solo su **metodo HTTP e percorso**, prima che la richiesta arrivi al controller.

| Regola | Indirizzi protetti |
|---|---|
| `permitAll` | `POST /api/auth/login`, `POST /api/auth/registrazione` |
| `permitAll` (la vetrina è pubblica) | `GET /api/dischi`, `GET /api/dischi/{id}` |
| `authenticated` (serve un utente collegato) | `/api/preferiti/**` — tutti i metodi |
| `authenticated` (`anyRequest`) | `GET /api/auth/me`, e ogni scrittura su `/api/dischi` |

Senza token valido su un indirizzo `authenticated` la risposta è **401**.
Il filtro non sa distinguere un USER da un ADMIN per la pubblicazione, e non sa di chi sia un preferito.

### Livello 2 — Annotazioni sui metodi (`@PreAuthorize` in `controller/DiscoController.java`)

Ragiona sull'**operazione**: pubblicare, modificare, eliminare un disco spetta all'amministratore.
Attivato da `@EnableMethodSecurity`.

| Annotazione | Indirizzi protetti |
|---|---|
| `@PreAuthorize("hasRole('ADMIN')")` | `POST /api/dischi`, `PUT /api/dischi/{id}`, `PATCH /api/dischi/{id}/pubblicazione`, `DELETE /api/dischi/{id}` |

Un USER collegato supera il livello 1 ma viene fermato qui con **403**.
Anche il ruolo decide la *forma* della risposta sui `GET /api/dischi`: il controller legge il ruolo
dall'`Authentication` e il service sceglie quale query e quale DTO usare. Il frontend non riceve mai
le bozze o il prezzo d'acquisto per poi nasconderli: quei dati non escono proprio dal server.

### Livello 3 — La query (`repository/PreferitoRepository.java`)

Né il filtro né l'annotazione sanno **di chi è il preferito numero sette**. Il ruolo dice *se puoi*, non *su quale riga*.
Per questo ogni lettura e cancellazione dei preferiti **restringe per proprietario** direttamente nella query:

```java
select p from Preferito p ... where p.id = :id and p.utente.id = :utenteId
delete from Preferito p where p.id = :id and p.utente.id = :utenteId
```

| Query | Indirizzi protetti |
|---|---|
| `findDelProprietario(utenteId)` | `GET /api/preferiti` |
| `findByIdDelProprietario(id, utenteId)` | `GET /api/preferiti/{id}` |
| `deleteByIdDelProprietario(id, utenteId)` | `DELETE /api/preferiti/{id}` |

- L'id del proprietario arriva **dal token** (`@AuthenticationPrincipal`), mai dal body o dall'URL.
- Non esiste un metodo che legga o cancelli un preferito per solo id (`findById` / `deleteById` non vengono usati).
- Il preferito di un altro utente risponde **404**, come uno inesistente: non si scopre nemmeno che esiste.

### Riepilogo

| Domanda | Chi risponde | Esito se negato |
|---|---|---|
| Serve essere collegati per questo indirizzo? | Livello 1 — catena dei filtri | 401 |
| Il tuo ruolo può fare questa operazione? | Livello 2 — `@PreAuthorize` | 403 |
| Questa riga è tua? | Livello 3 — query per proprietario | 404 |

## Prove eseguite

| Richiesta | Esito |
|---|---|
| anonimo `GET /api/dischi` | 200, solo pubblicati, senza campi riservati |
| anonimo `GET /api/dischi/5` (bozza) | 404 |
| anonimo `GET /api/preferiti` | 401 (livello 1) |
| anonimo `POST /api/dischi` | 401 (livello 1) |
| USER `POST /api/dischi` | 403 (livello 2) |
| USER `DELETE /api/dischi/7` | 403 (livello 2) |
| ADMIN `GET /api/dischi` | 200, bozze e campi riservati inclusi |
| ADMIN `POST`, `PATCH`, `DELETE` su `/api/dischi` | 201 / 200 / 204 |
| USER aggiunge ai preferiti una bozza | 404 |
| utente B `GET` / `DELETE` sul preferito dell'utente A | 404 / 404 (livello 3) |
| utente A `DELETE` sul proprio preferito | 204 |
