# FlatMate – WG-Verwaltungs-App

**FlatMate** ist eine Web-App zur Verwaltung von Wohngemeinschaften. Sie hilft
Mitbewohner:innen dabei, ihren gemeinsamen Alltag zu organisieren: WGs anlegen und
beitreten, geteilte Ausgaben erfassen und faire Salden berechnen, eine gemeinsame
Einkaufsliste pflegen und einen Putzplan koordinieren.

Die Anwendung ist mit **Next.js 16 / React 19** umgesetzt, nutzt **Prisma 7** mit
einer **SQLite**-Datenbank, **NextAuth** für die Authentifizierung und **Zod** zur
Validierung. Getestet wird mit **Vitest**.

---

## 📚 Dokumentation

Diese README dient als zentrale Zusammenfassung. Über die folgenden Links
sind alle relevanten Dokumente erreichbar:

| Dokument | Pfad |
|----------|------|
| **Software Requirements Specification (SRS)** | [docs/SoftwareRequirementsSpecification.md](docs/SoftwareRequirementsSpecification.md) |
| **arc42 (Architekturdokumentation)** | [docs/arc42.md](docs/arc42.md) |
| **Architecture Decision Records (ADRs)** | [docs/ArchitectureDecisionRecords.md](docs/ArchitectureDecisionRecords.md) |
| **Qualitätsbaum** | [docs/Qualitätsbaum.pdf](docs/Qualitätsbaum.pdf) |
| **Risikomanagement** | [docs/Risikomanagement/](docs/Risikomanagement/) |
| **Refactoring** | [docs/refactor.md](docs/refactor.md) |
| **Review-Protokoll** | [docs/review_protokoll.md](docs/review_protokoll.md) ⚠️ _(Datei noch anlegen)_ |
| **Testbericht** | [test_bericht.md](test_bericht.md) |
| **Metriken** | [docs/metriken.md](docs/metriken.md) ⚠️ _(Datei noch anlegen)_ |
| **Retrospektive** | [docs/retrospektive.md](docs/retrospektive.md) ⚠️ _(Datei noch anlegen)_ |
| **Use Cases** | [docs/useCases/](docs/useCases/) |
| **User Stories** | [docs/userStories.md](docs/userStories.md) |

### Weitere Artefakte

| Dokument | Pfad |
|----------|------|
| **UML-Diagramme** (Use-Case-, Aktivitäts-, Klassen-, Komponenten-, Sequenzdiagramme) | [docs/UMLs/](docs/UMLs/) |
| **Mockups** | [docs/mocups/](docs/mocups/) |
| **Commit-Konventionen** | [docs/commits.md](docs/commits.md) |

---

## 🔗 Projekt-Links

- **GitHub-Repository:** https://github.com/wwindrunnerr/flatmate
- **Scrum-Board:** https://github.com/users/wwindrunnerr/projects/1
- **Blog:** https://github.com/wwindrunnerr/flatmate/discussions

---

## 🚀 Getting Started

1. Abhängigkeiten installieren:
   ```bash
   npm install
   ```

2. Eine Datei `.env` im Projekt-Root `/flatmate` (NICHT in `/flatmate/src`) anlegen und
   folgende Zeile hinzufügen:
   ```
   DATABASE_URL="file:./dev.db"
   ```

3. Prisma-Client generieren:
   ```bash
   npx prisma generate
   ```

4. Datenbank-Schema anwenden:
   ```bash
   npx prisma migrate dev
   ```

**Hinweise**
- Die Datenbank ist lokal und wird nicht geteilt. Jede:r Entwickler:in hat eine eigene `dev.db`.
- `dev.db` nicht committen.
- Wenn sich das Prisma-Schema nach einem Pull ändert:
  ```bash
  npx prisma migrate dev
  npx prisma generate
  ```

Falls etwas nicht funktioniert:
```bash
rm -rf node_modules .next
npm install
npx prisma generate
npx prisma migrate dev
```

### App starten
```bash
npm run dev
```
Danach [http://localhost:3000](http://localhost:3000) im Browser öffnen.

### Prisma Studio öffnen
```bash
npx prisma studio
```

---

## 🧪 Tests

```bash
npm test                 # alle Tests
npm run test:unit        # Unit-Tests
npm run test:integration # Integrationstests
npm run test:coverage    # Coverage-Report
```
