# My Honey Pot

Konfigurowalny blog oparty na blockchainie Hive. Posty i konfiguracja są pobierane bezpośrednio z Hive - bez bazy danych.

## Wymagania

- Node.js 18+

## Instalacja

1. Zainstaluj zależności:
   ```bash
   npm install
   ```

2. Skonfiguruj zmienne środowiskowe:
   - Skopiuj `.env.example` do `.env`
   - Ustaw `HIVE_USERNAME` na nazwę użytkownika Hive, którego posty chcesz wyświetlać

## Uruchomienie

```bash
npm run dev
```

Strona będzie dostępna na `http://localhost:4321`

## Funkcje

- **Posty z Hive** - Automatyczne pobieranie postów z blockchaina Hive
- **Konfigurowalny layout** - Panel administracyjny do personalizacji wyglądu
- **Motywy kolorystyczne** - Wbudowane presety i własne kolory
- **Zapisywanie na Hive** - Konfiguracja zapisywana jako komentarz na blockchainie
- **HB-Auth login** - Logowanie przez Hive Keychain lub klucz prywatny

## Panel administracyjny

1. Przejdź do `/admin`
2. Zaloguj się kontem Hive (posting key lub active key)
3. Dostosuj wygląd bloga
4. Kliknij "Save Config on Hive" aby zapisać konfigurację

Konfiguracja jest zapisywana jako komentarz pod postem `@barddev/my-blog-configs`.

## Struktura projektu

```
├── src/
│   ├── pages/
│   │   ├── index.astro           # Strona główna z listą postów
│   │   ├── admin.astro           # Panel administracyjny
│   │   └── posts/
│   │       └── [permlink].astro  # Dynamiczna strona posta
│   ├── components/
│   │   ├── admin/                # Komponenty panelu admina (SolidJS)
│   │   ├── home/                 # Komponenty strony głównej (Astro)
│   │   ├── auth/                 # Komponenty logowania (SolidJS)
│   │   └── ui/                   # Reużywalne komponenty UI (SolidJS)
│   └── lib/
│       ├── hive.ts               # Funkcje do pobierania danych z Hive
│       └── blog-logic/           # Logika wax/beekeeper
├── .env                          # Zmienne środowiskowe
└── package.json
```

## Komendy

- `npm run dev` - Uruchom w trybie deweloperskim
- `npm run build` - Zbuduj projekt
- `npm run preview` - Podgląd zbudowanego projektu

## Tech Stack

- **Astro 5** - Framework SSR
- **SolidJS** - Interaktywne komponenty
- **Tailwind CSS 4** - Stylowanie
- **@hiveio/wax** - API Hive blockchain
- **@hiveio/hb-auth** - Autoryzacja Hive
