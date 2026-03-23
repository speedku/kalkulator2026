# Requirements: ALLBAG Kalkulator 2026

**Defined:** 2026-03-23
**Core Value:** Jeden zunifikowany system obsługujący cały cykl biznesowy ALLBAG — z nowoczesnym Aether UI, szybki i przyjemny w codziennym użyciu

## v1 Requirements

Wszystkie wymagania odpowiadają funkcjonalnościom z kalkulator2025, uzupełnione o wymogi prawne (KSeF) i ulepszenia UX.

---

### Authentication (AUTH)

- [ ] **AUTH-01**: Użytkownik może się zarejestrować emailem, hasłem i kodem dostępu
- [ ] **AUTH-02**: Użytkownik może się zalogować emailem i hasłem (sesja 7 dni)
- [ ] **AUTH-03**: Użytkownik może zresetować hasło przez link w emailu
- [ ] **AUTH-04**: Sesja użytkownika przetrwa odświeżenie przeglądarki (JWT)
- [ ] **AUTH-05**: Admin widzi panel admina, użytkownik widzi panel użytkownika (RBAC)
- [ ] **AUTH-06**: Admin może zarządzać uprawnieniami do poszczególnych stron
- [ ] **AUTH-07**: Po 5 nieudanych próbach logowania konto jest blokowane na 15 min
- [ ] **AUTH-08**: Admin może tworzyć i zarządzać kodami dostępu do rejestracji

### Products (PROD)

- [ ] **PROD-01**: Użytkownik może przeglądać listę produktów z wyszukiwaniem i filtrami
- [ ] **PROD-02**: Admin może tworzyć, edytować i usuwać produkty (nazwa, SKU, opis, cena zakupu)
- [ ] **PROD-03**: Admin może przypisywać produkty do kategorii/grup produktowych
- [ ] **PROD-04**: Admin może uploadować zdjęcia produktów
- [ ] **PROD-05**: Admin może importować produkty z pliku Excel
- [ ] **PROD-06**: System może synchronizować produkty z Subiekt GT (import)
- [ ] **PROD-07**: Admin może wykonywać operacje masowe na produktach (edycja, usunięcie)

### Pricing (PRICE)

- [ ] **PRICE-01**: Admin może tworzyć cenniki (price lists) dla różnych grup klientów
- [ ] **PRICE-02**: Admin może ustawiać marże w macierzy cennik × grupa produktowa
- [ ] **PRICE-03**: System automatycznie oblicza ceny sprzedaży na podstawie ceny zakupu i marży
- [ ] **PRICE-04**: Użytkownik może przeglądać przypisany mu cennik
- [ ] **PRICE-05**: Admin może klonować cenniki i edytować je masowo

### Quotations (QUOT)

- [ ] **QUOT-01**: Użytkownik może tworzyć wyceny z produktami i cenami z cennika
- [ ] **QUOT-02**: Wyceny mają unikalną numerację WYC-YYYY-#####
- [ ] **QUOT-03**: Użytkownik może eksportować wycenę do PDF
- [ ] **QUOT-04**: Użytkownik może wysłać wycenę emailem do klienta
- [ ] **QUOT-05**: Użytkownik może przeglądać historię wycen z filtrowaniem
- [ ] **QUOT-06**: Użytkownik może duplikować istniejącą wycenę

### Containers / China Import (CONT)

- [ ] **CONT-01**: Admin może tworzyć i zarządzać kontenerami (numer, przewoźnik, ETA)
- [ ] **CONT-02**: Admin może śledzić status kontenera (in_transit → at_port → unloaded → completed)
- [ ] **CONT-03**: Admin może dodawać pozycje (produkty) do kontenera
- [ ] **CONT-04**: Admin może uploadować dokumenty do kontenera (do MinIO)
- [ ] **CONT-05**: System wyświetla odliczanie do ETA kontenera
- [ ] **CONT-06**: Admin może generować etykiety chińskie dla produktów w kontenerze
- [ ] **CONT-07**: System pokazuje analityki kontenerów (wartość, terminowość, koszty)
- [ ] **CONT-08**: Admin może wysyłać powiadomienia email o statusie kontenera

### Domestic Deliveries (DELV)

- [ ] **DELV-01**: Admin może tworzyć i zarządzać dostawami krajowymi
- [ ] **DELV-02**: Admin może śledzić status dostawy krajowej
- [ ] **DELV-03**: System pokazuje kalendarz dostaw (China + krajowe)
- [ ] **DELV-04**: Admin może synchronizować dostawy z Subiekt GT

### Dashboard (DASH)

- [ ] **DASH-01**: Użytkownik widzi główny dashboard z KPI (sprzedaż, zamówienia, dostawy)
- [ ] **DASH-02**: Dashboard pokazuje wykresy trendów (tygodniowe, miesięczne)
- [ ] **DASH-03**: Dashboard pokazuje ostatnią aktywność w systemie
- [ ] **DASH-04**: Dashboard pokazuje nadchodzące dostawy i kontenery
- [ ] **DASH-05**: Użytkownik widzi powiadomienia w topnav (real-time badge)
- [ ] **DASH-06**: Użytkownik może zarządzać ustawieniami konta (hasło, preferencje)

### Analytics (ANAL)

- [ ] **ANAL-01**: Admin widzi dashboard sprzedaży (przychody, top produkty, top klienci)
- [ ] **ANAL-02**: Admin widzi porównanie rok do roku (YoY) i tydzień do tygodnia (WoW)
- [ ] **ANAL-03**: Admin widzi statystyki paczkarni (wydajność pakowaczy, kolejka)
- [ ] **ANAL-04**: Admin widzi dashboard magazynu i stan zapasów
- [ ] **ANAL-05**: Admin może eksportować raporty do Excel
- [ ] **ANAL-06**: System generuje raport martwych zapasów i zwrotów

### Invoicing (FACT)

- [ ] **FACT-01**: Admin może tworzyć faktury VAT
- [ ] **FACT-05**: Admin może eksportować faktury do PDF
- [ ] **FACT-06**: Admin może przeglądać historię faktur z filtrowaniem
- [ ] **FACT-07**: System obsługuje etykiety (label printing) dla zamówień

### Windykacja / AR (WIND)

- [ ] **WIND-01**: Admin widzi dashboard przeterminowanych płatności (aging buckets)
- [ ] **WIND-02**: Admin może tworzyć i wysyłać przypomnienia płatności (email)
- [ ] **WIND-03**: System generuje dokumenty windykacyjne (PDF)
- [ ] **WIND-04**: Admin może śledzić status spraw windykacyjnych

### AllTask Integration (TASK)

- [ ] **TASK-01**: Użytkownik może przejść do AllTask z poziomu kalkulator2026 (SSO)
- [ ] **TASK-02**: Topnav pokazuje badge z liczbą nieukończonych zadań (SSE)
- [ ] **TASK-03**: Dashboard główny pokazuje widget "Moje zadania"

### HR System (HR)

- [ ] **HR-01**: Admin może zarządzać danymi pracowników (CRUD)
- [ ] **HR-02**: System rejestruje godziny pracy pracowników
- [ ] **HR-03**: Admin może generować raporty HR (godziny, nieobecności)

### Email Campaigns (EMAIL)

- [ ] **EMAIL-01**: Admin może tworzyć kampanie emailowe z listami odbiorców
- [ ] **EMAIL-02**: Admin może projektować treść emaila (rich text editor)
- [ ] **EMAIL-03**: System wysyła kampanie przez SendGrid/Nodemailer
- [ ] **EMAIL-04**: Admin widzi analityki kampanii (wysłane, otwarte)

### Tradewatch (TRADE)

- [ ] **TRADE-01**: Admin może monitorować ceny produktów konkurencji
- [ ] **TRADE-02**: System wyświetla alerty gdy cena przekroczy próg

### AI Console (AI)

- [ ] **AI-01**: Użytkownik może używać chatbota AI (Claude/OpenAI) w kontekście danych biznesowych
- [ ] **AI-02**: System przechowuje historię rozmów AI
- [ ] **AI-03**: System obsługuje zapytania o dane (NL → SQL → wyniki)

### Kreator (KREA)

- [ ] **KREA-01**: Admin może tworzyć mockupy produktów na canvasie
- [ ] **KREA-02**: Admin może eksportować projekty do PNG i PDF

### CRM & B2B (CRM)

- [ ] **CRM-01**: Admin może zarządzać bazą klientów (CRUD)
- [ ] **CRM-02**: System wspiera lead generation (nowi potencjalni klienci)
- [ ] **CRM-03**: Admin może reaktywować nieaktywnych klientów
- [ ] **CRM-04**: Admin widzi pipeline sprzedażowy (etapy, wartości)
- [ ] **CRM-05**: System oferuje portal B2B dla klientów z cennikiem
- [ ] **CRM-06**: Admin widzi monitoring ochrony marki (brand protection)

### System Management (SYST)

- [ ] **SYST-01**: Admin może zarządzać użytkownikami (CRUD, role, uprawnienia)
- [ ] **SYST-02**: System loguje wszystkie aktywności użytkowników (audit log)
- [ ] **SYST-03**: Admin widzi log aktywności w panelu administracyjnym
- [ ] **SYST-04**: System obsługuje notatnik (notepad) dla użytkownika

---

## v2 Requirements

Odroczone — nie w bieżącej roadmapie.

### KSeF e-Invoicing

- **FACT-02**: System generuje faktury zgodne z KSeF (FA(3) XML schema)
- **FACT-03**: System może wysyłać faktury do KSeF API (Ministry of Finance)
- **FACT-04**: System generuje QR kody weryfikacyjne na fakturach KSeF

### Advanced Features

- **ADV-01**: Aplikacja mobilna (native mobile app)
- **ADV-02**: Wielojęzyczność (multi-language i18n, poza polskim)
- **ADV-03**: Custom report builder (drag-and-drop raporty)
- **ADV-04**: Full payroll processing (systemy płacowe, ZUS)
- **ADV-05**: Multi-tenant support (wiele firm w jednej instancji)

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Full ERP replacement | Subiekt GT pozostaje jako source of truth dla zamówień |
| Migration do PostgreSQL | MySQL 8 zachowane — zero ryzyka migracji danych prod |
| AllTask full rebuild | Dojrzała aplikacja FastAPI; iframe + SSO wystarczy |
| Native mobile app | Web-first (responsive), mobile w v2 |
| Payroll / ZUS | Zbyt specjalistyczne, poza scope ALLBAG |
| Multi-tenant | Single-tenant dla ALLBAG |

---

## Traceability

Wypełnione przez roadmapper podczas tworzenia roadmapy.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01...AUTH-08 | Phase 1 | Pending |
| PROD-01...PROD-07 | Phase 2 | Pending |
| PRICE-01...PRICE-05 | Phase 3 | Pending |
| QUOT-01...QUOT-06 | Phase 3 | Pending |
| CONT-01...CONT-08 | Phase 4 | Pending |
| DELV-01...DELV-04 | Phase 4 | Pending |
| DASH-01...DASH-06 | Phase 5 | Pending |
| ANAL-01...ANAL-06 | Phase 5 | Pending |
| FACT-01...FACT-07 | Phase 3 | Pending |
| WIND-01...WIND-04 | Phase 6 | Pending |
| TASK-01...TASK-03 | Phase 6 | Pending |
| HR-01...HR-03 | Phase 7 | Pending |
| EMAIL-01...EMAIL-04 | Phase 7 | Pending |
| TRADE-01...TRADE-02 | Phase 7 | Pending |
| AI-01...AI-03 | Phase 8 | Pending |
| KREA-01...KREA-02 | Phase 8 | Pending |
| CRM-01...CRM-06 | Phase 8 | Pending |
| SYST-01...SYST-04 | Phase 2 | Pending |

**Coverage:**
- v1 requirements: 77 total (KSeF FACT-02/03/04 przeniesione do v2)
- Mapped to phases: 77
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-23*
*Last updated: 2026-03-23 after initial definition*
