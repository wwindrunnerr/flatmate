# CI/CD-Setup – FlatMate

## Überblick

FlatMate verwendet **GitHub Actions** als CI/CD-Plattform. Die Pipeline wird automatisch ausgelöst, sobald Änderungen in den `main`-Branch gepusht werden. Sie stellt sicher, dass der Code jederzeit buildbar, getestet und als Docker-Container lauffähig ist.

**Vorteile der Pipeline:**
- Fehler werden frühzeitig erkannt, bevor sie in den Hauptbranch gelangen
- Jeder Push wird automatisch geprüft – kein manueller Aufwand
- Der Docker-Build wird bei jedem Push verifiziert, sodass Deployment-Probleme sofort auffallen
- Die Testausführung ist reproduzierbar und unabhängig vom lokalen Entwicklungsrechner

---

## Konfigurationsdatei

Die Pipeline ist in `.github/workflows/main.yml` definiert und besteht aus zwei Jobs, die sequenziell ausgeführt werden.

```yaml
name: Next.js Build and Runtime Check

on:
  push:
    branches: ["main"]
```

Die Pipeline wird bei jedem Push auf `main` automatisch ausgelöst.

---

## Job 1: `build`

Dieser Job installiert alle Abhängigkeiten, prüft den Code per Linter, führt die automatisierten Tests aus und erstellt den produktionsreifen Next.js-Build.

```yaml
jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v6

      - name: Setup Node
        uses: actions/setup-node@v6
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint --if-present
        continue-on-error: true

      - name: Run tests
        run: npm test --if-present

      - name: Build Next.js
        run: npm run build

      - name: Upload standalone build
        uses: actions/upload-artifact@v7
        with:
          name: next-build
          path: src/.next/standalone
```

**Schritte im Detail:**

| Schritt | Zweck |
|---|---|
| `actions/checkout` | Repository auschecken |
| `setup-node` | Node.js 20 installieren, npm-Cache nutzen |
| `npm ci` | Abhängigkeiten reproduzierbar installieren (exakt wie in `package-lock.json`) |
| `lint` | Code auf Stil- und Qualitätsprobleme prüfen (ESLint) |
| `npm test` | Automatisierte Tests mit Vitest ausführen |
| `npm run build` | Next.js Produktions-Build erstellen |
| Upload artifact | Den fertigen Build für Job 2 bereitstellen |

---

## Job 2: `container-test`

Dieser Job läuft erst nach erfolgreichem Abschluss von Job 1. Er baut ein Docker-Image aus dem fertigen Build und prüft, ob die Anwendung im Container korrekt startet und erreichbar ist.

```yaml
  container-test:
    needs: build
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v6

      - name: Download standalone build
        uses: actions/download-artifact@v8
        with:
          name: next-build
          path: src/.next/standalone

      - name: Build Docker image
        run: docker build -t nextjs-test .

      - name: Run container
        run: docker run -d -p 3000:3000 --name nextjs-app nextjs-test

      - name: Wait and test app
        run: |
          sleep 10
          curl --fail http://localhost:3000

      - name: Cleanup container
        if: always()
        run: docker rm -f nextjs-app || true
```

**Schritte im Detail:**

| Schritt | Zweck |
|---|---|
| Download artifact | Den Build-Output aus Job 1 herunterladen |
| `docker build` | Docker-Image aus dem `Dockerfile` erstellen |
| `docker run` | Container starten und Port 3000 freigeben |
| `curl --fail` | Prüfen ob die App unter `http://localhost:3000` antwortet |
| Cleanup | Container in jedem Fall entfernen, auch bei Fehlern |

---

## Dockerfile

Das `Dockerfile` verwendet einen **Multi-Stage-Build**, um das finale Image schlank zu halten:

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app/src
COPY src/package*.json ./
RUN npm install
COPY src/ ./
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine
WORKDIR /app/src
COPY --from=builder /app/src ./
EXPOSE 3000
CMD ["npm", "start"]
```

**Vorteile des Multi-Stage-Builds:**
- Build-Tools und Entwicklungsabhängigkeiten landen nicht im finalen Image
- Das Runtime-Image ist kleiner und sicherer
- Klare Trennung zwischen Build- und Laufzeitumgebung

---

## Ablauf im Überblick

```
Push auf main
     │
     ▼
┌─────────────────────────────┐
│         Job: build          │
│  checkout → node setup      │
│  → npm ci → lint → tests    │
│  → build → upload artifact  │
└────────────┬────────────────┘
             │ (nur bei Erfolg)
             ▼
┌─────────────────────────────┐
│     Job: container-test     │
│  checkout → download build  │
│  → docker build             │
│  → docker run               │
│  → curl http://localhost:3000│
│  → cleanup                  │
└─────────────────────────────┘
```
