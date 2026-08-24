# Fanta Luminous Platform — guida rapida in italiano

Questo file è una guida discorsiva per chi deve solo **far partire l'app e
capire cosa fa**. Per chi ci lavora sopra come agente/sviluppatore restano
validi come riferimento operativo `SYSTEM.md`, `AGENTS.md` e le ADR in
`docs/adr/`.

## Cos'è

Fanta Luminous Platform è uno strumento decisionale per l'asta del
fantacalcio: per ogni giocatore mostra un punteggio tecnico, un prezzo atteso,
un indice di rischio e di scarsità, e — durante l'asta vera e propria — ti
dice se conviene rilanciare su un'offerta e fino a quanto.

## Come è fatta (tre pezzi separati)

```text
browser
  -> web-bff :3001 (Fastify + Handlebars + JS vanilla, pagine renderizzate lato server)
      -> api :3000 (REST puro)
          -> SQLite + Redis + sorgenti pubbliche (Fantacalcio.it, FPEDIA)

web-bff -> @fanta/design-system (Web Component, nessun framework)
```

- **`apps/api`** — possiede tutta la logica di business, i dati, il calcolo
  degli indicatori e il modello di mercato. Espone solo endpoint REST sotto
  `/v1`.
- **`apps/web-bff`** — non è una SPA: renderizza le pagine sul server e parla
  con l'API solo via HTTP. Il browser non tocca mai il database dell'API.
- **`packages/design-system`** — componenti Web Component in JS vanilla
  (badge, bottoni, card, ricerca) usati dalle pagine del BFF.

## Dati inclusi (seed)

- 3 giocatori campione: Nico Paz, David De Gea, Moise Kean.
- 200 transazioni reali dell'asta 2025/26 della lega.
- Il modello di mercato calibrato su quell'unica stagione — per questo ogni
  prezzo stimato espone una "confidenza" conservativa (non ci sono ancora due
  stagioni complete per validare meglio i coefficienti).

## Cosa puoi fare nell'interfaccia

- **`/`** — dashboard con i giocatori seed e lo stato della calibrazione.
- **`/players`** — listone giocatori con ricerca.
- **`/players/:id`** — scheda giocatore con gli indicatori (tecnico, rischio,
  scarsità, prezzo atteso) e il pannello **"Valuta l'offerta"**: inserisci
  offerta attuale, budget residuo e slot residui in rosa, e ottieni il
  rilancio massimo consigliato (o l'indicazione di ritirarti).
- **`/design-system`** — pagina demo dei componenti UI.

Endpoint REST principali (`http://localhost:3000/v1`, documentazione Swagger
su `http://localhost:3000/docs`):

| Metodo | Endpoint | Cosa fa |
|---|---|---|
| GET | `/v1/health` | stato del servizio |
| GET | `/v1/players` | lista giocatori |
| GET | `/v1/players/:id` | dettaglio giocatore |
| GET | `/v1/players/:id/indicators` | indicatori tecnici/mercato |
| GET | `/v1/market/model` | modello di calibrazione mercato |
| POST | `/v1/auction/evaluate` | valuta un'offerta in corso |

## Come avviarla

Due modi, entrambi testati e funzionanti.

### 1. In locale (per sviluppo)

```bash
cp .env.example .env        # opzionale: i valori di default vanno già bene
npm run bootstrap           # installa le dipendenze, builda il design system,
                             # applica le migrazioni, carica i dati seed, verifica tutto
npm run dev:api              # terminale 1 — API su :3000
npm run dev:web               # terminale 2 — BFF su :3001
```

Poi apri:
- Dashboard: <http://localhost:3001>
- API: <http://localhost:3000/v1>
- Swagger: <http://localhost:3000/docs>

`npm run bootstrap` è idempotente: puoi rilanciarlo quante volte vuoi senza
effetti collaterali.

### 2. Con Docker (tutto insieme, senza installare nulla in locale)

```bash
docker compose up --build
```

Fa tutto da solo (build immagini, migrazioni, seed, avvio dei due servizi).
Stessi indirizzi di sopra, sulle stesse porte. Per fermare:

```bash
docker compose down
```

### Verifica manuale

```bash
npm run verify   # controllo architettura Luminous + sintassi + test
```

## Limiti da tenere a mente

- Il modello di prezzo è calibrato su **una sola stagione** d'asta reale
  (2025/26): trattalo come baseline prudente, non come oracolo.
- I dati grezzi della chat WhatsApp della lega **non** sono inclusi nel
  repository, solo segnali derivati e anonimizzati.
