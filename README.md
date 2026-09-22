# Solco — vetrina di dischi (U5W7D2)

Sito vetrina con tre livelli di accesso (ospite, utente, amministratore): stessi indirizzi, risposte diverse decise dal server.

- `BE/` — Spring Boot 4, Spring Security + JWT, PostgreSQL. Relazione sui tre livelli di protezione in [`BE/README.md`](BE/README.md).
- `FE/` — React 19 + Vite, Three.js (giradischi 3D con scratch), React Bits. Dettagli in [`FE/README.md`](FE/README.md).

## Avvio rapido (Windows)

Requisiti: Java 25, Node 20+, PostgreSQL con il database `U5W7D2` (utente `postgres`, password `1234`).

Doppio click su **`avvio.cmd`**: apre il backend (http://localhost:8080) e il frontend (http://localhost:5173)
in due finestre e apre il browser quando il backend risponde. Per fermare tutto si chiudono le due finestre.

## Versione pubblicata

https://justmeth25.github.io/FS0226IT---U5W7D2/

GitHub Pages ospita solo il frontend (file statici). Il backend con il database gira in locale:
il sito pubblicato funziona sul PC dove è acceso `avvio.cmd` (il backend accetta anche l'origine `https://justmeth25.github.io`).
Altrove mostra un avviso invece della vetrina.

Per aggiornare la versione pubblicata:

```bash
cd FE
npm run build:pages
npx gh-pages -d dist --dotfiles
```
