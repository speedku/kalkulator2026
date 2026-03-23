# Requirements: ALLBAG Kalkulator 2026

**Defined:** 2026-03-23
**Core Value:** Jeden zunifikowany system obsługujący cały cykl biznesowy ALLBAG — z nowoczesnym Aether UI, szybki i przyjemny w codziennym użyciu

## v1 Requirements

Wszystkie wymagania odpowiadają funkcjonalnościom z kalkulator2025, uzupełnione o wymogi prawne (KSeF) i ulepszenia UX.

---

### Authentication (AUTH)

- [x] **AUTH-01**: Użytkownik może się zarejestrować emailem, hasłem i kodem dostępu
- [x] **AUTH-02**: Użytkownik może się zalogować emailem i hasłem (sesja 7 dni)
- [x] **AUTH-03**: Użytkownik może zresetować hasło przez link w emailu
- [x] **AUTH-04**: Sesja użytkownika przetrwa odświeżenie przeglądarki (JWT)
- [x] **AUTH-05**: Admin widzi panel admina, użytkownik widzi panel użytkownika (RBAC)
- [x] **AUTH-06**: Admin może zarządzać uprawnieniami do poszczególnych stron
- [x] **AUTH-07**: Po 5 nieudanych próbach logowania konto jest blokowane na 15 min
- [x] **AUTH-08**: Admin może tworzyć i zarządzać kodami dostępu do rejestracji

### Products (PROD)

- [x] **PROD-01**: Użytkownik może przeglądać listę produktów z wyszukiwaniem i filtrami
- [x] **PROD-02**: Admin może tworzyć, edytować i usuwać produkty (nazwa, SKU, opis, cena zakupu)
- [x] **PROD-03**: Admin może przypisywać produkty do kategorii/grup produktowych
- [x] **PROD-04**: Admin może uploadować zdjęcia produktów
- [x] **PROD-05**: Admin może importować produkty z pliku Excel
- [x] **PROD-06**: System może synchronizować produkty z Subiekt GT (import)
- [x] **PROD-07**: Admin może wykonywać operacje masowe na produktach (edycja, usunięcie)

### Pricing (PRICE)

- [x] **PRICE-01**: Admin może tworzyć cenniki (price lists) dla różnych grup klientów
- [x] **PRICE-02**: Admin może ustawiać marże w macierzy cennik x grupa produktowa
- [x] **PRICE-03**: System automatycznie oblicza ceny sprzedaży na podstawie ceny zakupu i marży
- [x] **PRICE-04**: Użytkownik może przeglądać przypisany mu cennik
- [x] **PRICE-05**: Admin może klonować cenniki i edytować je masowo

### Quotations (QUOT)

- [x] **QUOT-01**: Użytkownik może tworzyć wyceny z produktami i cenami z cennika
- [x] **QUOT-02**: Wyceny mają unikalną numerację WYC-YYYY-#####
- [x] **QUOT-03**: Użytkownik może eksportować wycenę do PDF
- [x] **QUOT-04**: Użytkownik może wysłać wycenę emailem do klienta
- [x] **QUOT-05**: Użytkownik może przeglądać historię wycen z filtrowaniem
- [x] **QUOT-06**: Użytkownik może duplikować istniejącą wycenę

### Containers / China Import (CONT)

- [x] **CONT-01**: Admin może tworzyć i zarządzać kontenerami (numer, przewoźnik, ETA)
- [x] **CONT-02**: Admin może śledzić status kontenera (in_transit > at_port > unloaded > completed)
- [x] **CONT-03**: Admin może dodawać pozycje (produkty) do kontenera
- [x] **CONT-04**: Admin może uploadować dokumenty do kontenera (do MinIO)
- [x] **CONT-05**: System wyświetla odliczanie do ETA kontenera
- [x] **CONT-06**: Admin może generować etykiety chińskie dla produktów w kontenerze
- [x] **CONT-07**: System pokazuje analityki kontenerów (wartość, terminowość, koszty)
- [x] **CONT-08**: Admin może wysyłać powiadomienia email o statusie kontenera

### Domestic Deliveries (DELV)

- [x] **DELV-01**: Admin może tworzyć i zarządzać dostawami krajowymi
- [x] **DELV-02**: Admin może śledzić status dostawy krajowej
- [x] **DELV-03**: System pokazuje kalendarz dostaw (China + krajowe)
- [x] **DELV-04**: Admin może synchronizować dostawy z Subiekt GT

### Dashboard (DASH)

- [x] **DASH-01**: Użytkownik widzi główny dashboard z KPI (sprzedaż, zamówienia, dostawy)
- [x] **DASH-02**: Dashboard pokazuje wykresy trendów (tygodniowe, miesięczne)
- [x] **DASH-03**: Dashboard pokazuje ostatnią aktywność w systemie
- [x] **DASH-04**: Dashboard pokazuje nadchodzące dostawy i kontenery
- [x] **DASH-05**: Użytkownik widzi powiadomienia w topnav (real-time badge)
- [x] **DASH-06**: Użytkownik może zarządzać ustawieniami konta (hasło, preferencje)

### Analytics (ANAL)

- [x] **ANAL-01**: Admin widzi dashboard sprzedaży (przychody, top produkty, top klienci)
- [x] **ANAL-02**: Admin widzi porównanie rok do roku (YoY) i tydzień do tygodnia (WoW)
- [x] **ANAL-03**: Admin widzi statystyki paczkarni (wydajność pakowaczy, kolejka)
- [x] **ANAL-04**: Admin widzi dashboard magazynu i stan zapasów
- [x] **ANAL-05**: Admin może eksportować raporty do Excel
- [x] **ANAL-06**: System generuje raport martwych zapasów i zwrotów

### Invoicing (FACT)

- [x] **FACT-01**: Admin może tworzyć faktury VAT
- [x] **FACT-05**: Admin może eksportować faktury do PDF
- [x] **FACT-06**: Admin może przeglądać historię faktur z filtrowaniem
- [x] **FACT-07**: System obsługuje etykiety (label printing) dla zamówień

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
- [ ] **AI-03**: System obsługuje zapytania o dane (NL > SQL > wyniki)

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

- [x] **SYST-01**: Admin może zarządzać użytkownikami (CRUD, role, uprawnienia)
- [x] **SYST-02**: System loguje wszystkie aktywności użytkowników (audit log)
- [x] **SYST-03**: Admin widzi log aktywności w panelu administracyjnym
- [x] **SYST-04**: System obsługuje notatnik (notepad) dla użytkownika

---

## v2 Requirements

Odroczone -- nie w bieżącej roadmapie.

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
| Migration do PostgreSQL | MySQL 8 zachowane -- zero ryzyka migracji danych prod |
| AllTask full rebuild | Dojrzała aplikacja FastAPI; iframe + SSO wystarczy |
| Native mobile app | Web-first (responsive), mobile w v2 |
| Payroll / ZUS | Zbyt specjalistyczne, poza scope ALLBAG |
| Multi-tenant | Single-tenant dla ALLBAG |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1: Foundation, Auth & System Shell | Complete |
| AUTH-02 | Phase 1: Foundation, Auth & System Shell | Complete |
| AUTH-03 | Phase 1: Foundation, Auth & System Shell | Complete |
| AUTH-04 | Phase 1: Foundation, Auth & System Shell | Complete |
| AUTH-05 | Phase 1: Foundation, Auth & System Shell | Complete |
| AUTH-06 | Phase 1: Foundation, Auth & System Shell | Complete |
| AUTH-07 | Phase 1: Foundation, Auth & System Shell | Complete |
| AUTH-08 | Phase 1: Foundation, Auth & System Shell | Complete |
| SYST-01 | Phase 1: Foundation, Auth & System Shell | Complete |
| SYST-02 | Phase 1: Foundation, Auth & System Shell | Complete |
| SYST-03 | Phase 1: Foundation, Auth & System Shell | Complete |
| SYST-04 | Phase 1: Foundation, Auth & System Shell | Complete |
| PROD-01 | Phase 2: Product Management | Complete |
| PROD-02 | Phase 2: Product Management | Complete |
| PROD-03 | Phase 2: Product Management | Complete |
| PROD-04 | Phase 2: Product Management | Complete |
| PROD-05 | Phase 2: Product Management | Complete |
| PROD-06 | Phase 2: Product Management | Complete |
| PROD-07 | Phase 2: Product Management | Complete |
| PRICE-01 | Phase 3: Pricing Engine | Complete |
| PRICE-02 | Phase 3: Pricing Engine | Complete |
| PRICE-03 | Phase 3: Pricing Engine | Complete |
| PRICE-04 | Phase 3: Pricing Engine | Complete |
| PRICE-05 | Phase 3: Pricing Engine | Complete |
| QUOT-01 | Phase 4: Quotations & Invoicing | Complete |
| QUOT-02 | Phase 4: Quotations & Invoicing | Complete |
| QUOT-03 | Phase 4: Quotations & Invoicing | Complete |
| QUOT-04 | Phase 4: Quotations & Invoicing | Complete |
| QUOT-05 | Phase 4: Quotations & Invoicing | Complete |
| QUOT-06 | Phase 4: Quotations & Invoicing | Complete |
| FACT-01 | Phase 4: Quotations & Invoicing | Complete |
| FACT-05 | Phase 4: Quotations & Invoicing | Complete |
| FACT-06 | Phase 4: Quotations & Invoicing | Complete |
| FACT-07 | Phase 4: Quotations & Invoicing | Complete |
| CONT-01 | Phase 5: Containers & Deliveries | Complete |
| CONT-02 | Phase 5: Containers & Deliveries | Complete |
| CONT-03 | Phase 5: Containers & Deliveries | Complete |
| CONT-04 | Phase 5: Containers & Deliveries | Complete |
| CONT-05 | Phase 5: Containers & Deliveries | Complete |
| CONT-06 | Phase 5: Containers & Deliveries | Complete |
| CONT-07 | Phase 5: Containers & Deliveries | Complete |
| CONT-08 | Phase 5: Containers & Deliveries | Complete |
| DELV-01 | Phase 5: Containers & Deliveries | Complete |
| DELV-02 | Phase 5: Containers & Deliveries | Complete |
| DELV-03 | Phase 5: Containers & Deliveries | Complete |
| DELV-04 | Phase 5: Containers & Deliveries | Complete |
| DASH-01 | Phase 6: Dashboard & Analytics | Complete |
| DASH-02 | Phase 6: Dashboard & Analytics | Complete |
| DASH-03 | Phase 6: Dashboard & Analytics | Complete |
| DASH-04 | Phase 6: Dashboard & Analytics | Complete |
| DASH-05 | Phase 6: Dashboard & Analytics | Complete |
| DASH-06 | Phase 6: Dashboard & Analytics | Complete |
| ANAL-01 | Phase 6: Dashboard & Analytics | Complete |
| ANAL-02 | Phase 6: Dashboard & Analytics | Complete |
| ANAL-03 | Phase 6: Dashboard & Analytics | Complete |
| ANAL-04 | Phase 6: Dashboard & Analytics | Complete |
| ANAL-05 | Phase 6: Dashboard & Analytics | Complete |
| ANAL-06 | Phase 6: Dashboard & Analytics | Complete |
| CRM-01 | Phase 7: CRM & Accounts Receivable | Pending |
| CRM-02 | Phase 7: CRM & Accounts Receivable | Pending |
| CRM-03 | Phase 7: CRM & Accounts Receivable | Pending |
| CRM-04 | Phase 7: CRM & Accounts Receivable | Pending |
| CRM-05 | Phase 7: CRM & Accounts Receivable | Pending |
| CRM-06 | Phase 7: CRM & Accounts Receivable | Pending |
| WIND-01 | Phase 7: CRM & Accounts Receivable | Pending |
| WIND-02 | Phase 7: CRM & Accounts Receivable | Pending |
| WIND-03 | Phase 7: CRM & Accounts Receivable | Pending |
| WIND-04 | Phase 7: CRM & Accounts Receivable | Pending |
| HR-01 | Phase 8: HR, Email Campaigns & AllTask | Pending |
| HR-02 | Phase 8: HR, Email Campaigns & AllTask | Pending |
| HR-03 | Phase 8: HR, Email Campaigns & AllTask | Pending |
| EMAIL-01 | Phase 8: HR, Email Campaigns & AllTask | Pending |
| EMAIL-02 | Phase 8: HR, Email Campaigns & AllTask | Pending |
| EMAIL-03 | Phase 8: HR, Email Campaigns & AllTask | Pending |
| EMAIL-04 | Phase 8: HR, Email Campaigns & AllTask | Pending |
| TASK-01 | Phase 8: HR, Email Campaigns & AllTask | Pending |
| TASK-02 | Phase 8: HR, Email Campaigns & AllTask | Pending |
| TASK-03 | Phase 8: HR, Email Campaigns & AllTask | Pending |
| AI-01 | Phase 9: AI Console, Tradewatch & Kreator | Pending |
| AI-02 | Phase 9: AI Console, Tradewatch & Kreator | Pending |
| AI-03 | Phase 9: AI Console, Tradewatch & Kreator | Pending |
| TRADE-01 | Phase 9: AI Console, Tradewatch & Kreator | Pending |
| TRADE-02 | Phase 9: AI Console, Tradewatch & Kreator | Pending |
| KREA-01 | Phase 9: AI Console, Tradewatch & Kreator | Pending |
| KREA-02 | Phase 9: AI Console, Tradewatch & Kreator | Pending |

**Coverage:**
- v1 requirements: 85 total (KSeF FACT-02/03/04 deferred to v2)
- Mapped to phases: 85/85
- Unmapped: 0

---
*Requirements defined: 2026-03-23*
*Last updated: 2026-03-23 after roadmap creation*
