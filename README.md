# Solco — vetrina di dischi (U5W7D2)

Sito vetrina con tre livelli di accesso (ospite, utente, amministratore): stessi indirizzi, risposte diverse decise dal server.

- `BE/` — Spring Boot 4, Spring Security + JWT, PostgreSQL. Relazione sui tre livelli di protezione in [`BE/README.md`](BE/README.md).
- `FE/` — React 19 + Vite, Three.js (giradischi 3D con scratch), React Bits. Dettagli in [`FE/README.md`](FE/README.md).

## Avvio rapido (Windows)

Requisiti: Java 25, Node 20+, PostgreSQL con il database `U5W7D2` (utente `postgres`, password `1234`).

Doppio click su **`avvio.cmd`**: apre il backend (http://localhost:8080) e il frontend (http://localhost:5173)
in due finestre e apre il browser quando il backend risponde. Per fermare tutto si chiudono le due finestre.

## Versione pubblicata

- Frontend: https://justmeth25.github.io/FS0226IT---U5W7D2/ (GitHub Pages)
- Backend: https://solco-api.onrender.com (Render, piano gratuito, profilo `demo`)

Il backend pubblico usa il profilo **`demo`** (`BE/src/main/resources/application-demo.properties`):
database **H2 in memoria** dentro lo stesso server, nessun servizio di database esterno.

- Ogni riavvio riparte dal seed di `DataInitializer`: dischi, utenti registrati e preferiti aggiunti online si azzerano.
  Per rendere permanente un disco va aggiunto al seed.
- Il piano gratuito di Render si addormenta dopo circa 15 minuti senza visite: la prima richiesta successiva
  impiega fino a un minuto (il sito mostra un messaggio d'attesa).
- Account di prova per i visitatori: `visitatore@vetrina.it` / `visitatore1234` (ruolo USER).
- La password dell'admin **non** è nel repository: Render la genera al primo deploy (`ADMIN_PASSWORD`)
  e si legge in Dashboard → servizio `solco-api` → Environment.

### Primo deploy del backend (una volta sola)

1. Accedi a https://render.com con l'account GitHub.
2. **New → Blueprint**, scegli il repository `FS0226IT---U5W7D2`: Render legge `render.yaml` e crea il servizio `solco-api`.
3. Conferma con **Apply**. La prima build Docker richiede qualche minuto.
4. Se Render assegna un indirizzo diverso da `https://solco-api.onrender.com`, aggiorna `FE/.env.pages` e ripubblica il frontend.

Ogni push su `main` fa ripartire il deploy del backend in automatico.

### Aggiornare il frontend pubblicato

```bash
cd FE
npm run build:pages
npx gh-pages -d dist --dotfiles
```
