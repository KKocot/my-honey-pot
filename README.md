# Astro + Payload CMS

Projekt startowy integrujący Astro z Payload CMS.

## Wymagania

- Node.js 18+
- MongoDB (lokalne lub MongoDB Atlas)

## Instalacja

1. Zainstaluj zależności:
   ```bash
   npm install
   ```

2. Skonfiguruj zmienne środowiskowe:
   - Skopiuj `.env.example` do `.env`
   - Ustaw `MONGODB_URI` na adres swojej bazy danych MongoDB
   - Ustaw `PAYLOAD_SECRET` na losowy ciąg znaków

## Uruchomienie

### 1. Uruchom serwer Payload CMS (w osobnym terminalu):
```bash
npm run payload
```
Payload CMS będzie dostępny na `http://localhost:3000`
Panel administracyjny: `http://localhost:3000/admin`

### 2. Uruchom Astro (w osobnym terminalu):
```bash
npm run dev
```
Strona będzie dostępna na `http://localhost:4321`

## Pierwsze kroki

1. Uruchom serwer Payload i przejdź do `http://localhost:3000/admin`
2. Utwórz konto administratora
3. Dodaj nowy post w kolekcji "Posts"
4. Ustaw status na "Published"
5. Odśwież stronę Astro, aby zobaczyć nowy post

## Struktura projektu

```
├── src/
│   ├── pages/
│   │   ├── index.astro         # Strona główna z listą postów
│   │   └── posts/
│   │       └── [slug].astro    # Dynamiczna strona posta
│   └── payload/
│       ├── collections/
│       │   ├── Posts.ts        # Kolekcja postów
│       │   ├── Users.ts        # Kolekcja użytkowników
│       │   └── Media.ts        # Kolekcja mediów
│       ├── payload.config.ts   # Konfiguracja Payload
│       └── server.ts           # Serwer Express + API
├── .env                        # Zmienne środowiskowe
└── package.json
```

## Komendy

- `npm run dev` - Uruchom Astro w trybie deweloperskim
- `npm run payload` - Uruchom serwer Payload CMS
- `npm run build` - Zbuduj projekt Astro
- `npm run preview` - Podgląd zbudowanego projektu
