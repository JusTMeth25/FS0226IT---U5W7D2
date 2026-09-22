# Solco — Frontend (U5W7D2)

Vetrina di dischi in vinile: React 19 + TypeScript + Vite, con Three.js e componenti React Bits.

## Avvio

```bash
npm install
npm run dev        # http://localhost:5173
```

Il backend deve essere acceso su `http://localhost:8080` (vedi `../BE/README.md`).
Per puntare altrove: `VITE_API_URL=http://... npm run dev`.

Account di prova (pulsanti rapidi nella pagina di login):

| Ruolo | Email | Password |
|---|---|---|
| ADMIN | `admin@vetrina.it` | `admin1234` |
| USER | `anna@test.it` | `password1` |
| USER | `bruno@test.it` | `password1` |

## Pagine

| Percorso | Cosa fa |
|---|---|
| `/` | Hero 3D (il disco esce e rientra dalla busta), pannello "come ti vede il server", vetrina con ricerca, generi, ordinamento |
| `/dischi/:id` | Giradischi 3D con braccio animato, 33⅓/45 giri, fruscio sintetizzato; per l'admin la scheda riservata |
| `/preferiti` | "La tua cassa": i preferiti dell'utente collegato |
| `/admin` | Regia: statistiche, pubblica/bozza, crea, modifica, elimina |
| `/login`, `/registrazione` | Accesso |

## Anteprima audio

Premendo **Metti su** il braccio scende sul disco e parte un'anteprima di 30 secondi:

1. se la scheda ha `anteprimaUrl` (scelta dall'admin) si usa quella;
2. altrimenti la pagina cerca su **iTunes Search API** (`src/api/itunes.ts`) la prima traccia dell'album.

Il fruscio sintetizzato resta sotto la musica, più basso. A 45 giri l'audio va più veloce e più acuto,
come su un giradischi vero (`preservesPitch = false`). Finiti i 30 secondi la puntina si alza da sola.
Accanto al brano c'è il link **Ascolta su Apple Music**: le anteprime di Apple servono a promuovere i brani sul suo store.

In regia, nel form del disco, **Cerca su iTunes** mostra i brani trovati: si ascoltano e con **Usa** si salvano sulla scheda.

## Chi decide cosa si vede

Il frontend **non filtra** bozze o campi riservati: mostra quello che il server manda.

- `isDiscoAdmin(d)` controlla solo se nella risposta c'è il campo `pubblicato`.
  Se c'è, la card mostra timbro "Bozza" e riquadro "riservato"; se non c'è, non esiste nulla da nascondere.
- Il pannello *Stesso indirizzo, tre risposte* conta dischi, bozze e campi ricevuti da `GET /api/dischi`.
  Cambiando utente i numeri cambiano, perché cambia la risposta.
- Le guardie `RichiedeAccesso` / `RichiedeAdmin` servono solo all'esperienza d'uso:
  la protezione vera è nei tre livelli del backend (401 / 403 / 404).

## Librerie

- **three**, **@react-three/fiber**, **@react-three/drei**: disco, busta e giradischi 3D.
  Texture di solchi ed etichette disegnate su canvas; se una copertina non si carica si genera un'etichetta.
- **React Bits** (copiati in `src/components/reactbits`, esclusi dal lint):
  SplitText, ShinyText, GradientText, CountUp, DecryptedText, SpotlightCard, TiltedCard,
  StarBorder, Magnet, ClickSpark, LightRays, Noise.
- **motion**: transizioni di pagina, liste animate, toast.
- **gsap**, **ogl**: dipendenze dei componenti React Bits.
- **react-router-dom**: routing.

Nota: `@react-three/fiber` 9 richiede React `< 19.3`, per questo React è fissato a `~19.2.8`.
