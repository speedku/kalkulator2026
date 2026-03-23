# ALLBAG Kalkulator 2026

## What This Is

ALLBAG Kalkulator 2026 to pełna przebudowa systemu kalkulator2025 — kompleksowej platformy do zarządzania biznesem dla firmy ALLBAG (import i dystrybucja). Nowa wersja zachowuje wszystkie funkcjonalności poprzedniej, ale opiera się na całkowicie nowoczesnym stosie technologicznym (Next.js 15, React 19, Prisma, TypeScript) i prezentuje futurystyczny design w stylu "Aether" — ciemny motyw, neonowe poświaty, glassmorphism.

## Core Value

Jeden zunifikowany system, który obsługuje cały cykl biznesowy ALLBAG: od importu produktów, przez wyceny i cenniki, po analizy i zarządzanie dostawami — z nowoczesnym UI, który jest szybki, estetyczny i przyjemny w codziennym użyciu.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Autentykacja z RBAC (rejestracja z kodami dostępu, login, reset hasła, role admin/user)
- [ ] Zarządzanie produktami (CRUD, kategorie, SKU, zdjęcia MinIO, import Excel)
- [ ] System wycen (numeracja WYC-YYYY-#####, builder wyceny, eksport PDF, email)
- [ ] Cenniki z marżami (macierz price_list × product_group, edytor wizualny)
- [ ] Moduł dostaw — kontenery China (śledzenie statusu, ETA, etykiety, dokumenty)
- [ ] Moduł dostaw krajowych
- [ ] Dashboard główny z KPI, wykresami, aktywnością i powiadomieniami
- [ ] Analityki sprzedaży (dashboard, trendy tygodniowe/miesięczne, YoY)
- [ ] Analityki paczkarni (wydajność pakowaczy, kolejka)
- [ ] AllTask — Kanban, chat, powiadomienia (integracja SSO)
- [ ] Windykacja (przypomnienia płatności, dashboard przeterminowań)
- [ ] HR system (pracownicy, godziny, raporty)
- [ ] Kampanie email (builder, listy odbiorców, analityki)
- [ ] Tradewatch (monitoring cen)
- [ ] AI Konsola (chat z Claude/OpenAI)
- [ ] Kreator (canvas tool, eksport PNG/PDF)
- [ ] Faktury, etykiety, notatnik
- [ ] Integracja Subiekt GT (sync produktów, zamówień)
- [ ] B2B portal, CRM (leadgen, reaktywacja, pipeline)
- [ ] Zarządzanie użytkownikami i uprawnieniami

### Out of Scope

- Przepisanie backendu AllTask (Python/FastAPI) — zachowany as-is, integracja przez iframe/SSO
- Migracja bazy danych do PostgreSQL — zostaje MySQL 8 dla kompatybilności z danymi produkcyjnymi
- Mobilna aplikacja natywna — najpierw web (responsive), mobile later
- Pełna przepisanie 176 endpointów PHP w dniu 1 — stopniowa migracja przez PHP bridge

## Context

**Istniejący system (kalkulator2025):**
- PHP 8 backend (176 endpointów API) + 4 osobne sub-aplikacje React/Vite (fragmentaryczna architektura)
- MySQL na mail.allbag.pl (tabele: users, products, quotations, quotation_items, price_lists, product_groups, price_list_margins, containers, container_items, domestic_deliveries, notifications, activity_logs i 20+ innych)
- Redis (cache/sesje), MinIO (zdjęcia produktów), WebSocket dla AllTask
- Integracje: Subiekt GT (ERP), SendGrid, Twilio, OpenAI/Anthropic, GUS BIR1, Google reCAPTCHA

**Design target — Aether Futuristic SaaS:**
- Tło: near-black (#080812, #0a0a1e)
- Akcenty: electric blue (#6366f1), cyan (#06b6d4), purple (#8b5cf6)
- Glassmorphism: backdrop-blur, semi-transparent borders
- Animacje: Framer Motion 12 (spring physics)
- Typografia: Space Grotesk (display), Inter Variable (body), JetBrains Mono (dane)

**Środowisko XAMPP:**
- Apache na porcie 80, Next.js na porcie 3001
- ProxyPass: `/kalkulator2026` → `http://localhost:3001`
- PM2 do zarządzania procesem Node.js

## Constraints

- **Tech stack**: Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS 4 + Prisma 6 — nowe funkcje NIE mogą używać starszego stosu
- **Database**: MySQL 8 (bez migracji) — Prisma mapuje na istniejący schemat przez `prisma db pull`
- **Compatibility**: PHP bridge (`/kalkulator2025/api/`) pozostaje aktywny do czasu pełnej migracji endpointów
- **Deployment**: XAMPP (Windows, lokalne środowisko) — Apache ProxyPass + PM2
- **Data safety**: Prisma i PHP współdzielą tę samą bazę MySQL; żadne migracje schematu bez pełnej analizy wpływu

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js 15 monorepo | Eliminuje 4 osobne systemy build z kalkulator2025; jeden deployment | — Pending |
| MySQL zachowane | Zero ryzyka migracji danych produkcyjnych | — Pending |
| NextAuth v5 Credentials | Weryfikuje bcrypt z tabeli `users`, RBAC z `user_permissions` | — Pending |
| PHP bridge pattern | 176 endpointów PHP stopniowo migrowanych; ship szybko, migruj iteracyjnie | — Pending |
| Tailwind CSS 4 @theme | Token-driven design system dla spójnego Aether theme | — Pending |
| AllTask iframe embed | Dojrzała aplikacja FastAPI+React; SSO bridge szybszy niż full rebuild | — Pending |
| shadcn/ui + Radix | Unstyled primitives → pełna restyling na Aether design tokens | — Pending |

---
*Last updated: 2026-03-23 after initialization*
