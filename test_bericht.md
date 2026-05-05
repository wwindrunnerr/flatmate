# Testbericht – FlatMate

Im Rahmen der Qualitätssicherung für das FlatMate-Projekt wurde eine automatisierte Testumgebung eingerichtet und erste zentrale Module der Anwendung mit Unit- und Integrationstests abgesichert. Ziel war es, vor allem kritische Kernlogik wie Validierung, Budgetverwaltung, Rechteprüfung und Schuldenberechnung zuverlässig testbar zu machen.

## 1. Teststrategie

Für das Projekt wurde eine Kombination aus Unit-Tests und Integrationstests gewählt.

Unit-Tests werden eingesetzt, um einzelne Funktionen isoliert zu prüfen. Sie eignen sich besonders für Validierungslogik, Hilfsfunktionen und Berechnungen, da Fehler dort schnell erkannt und eindeutig zugeordnet werden können.

Integrationstests werden ergänzend vorbereitet, um vollständige API-Flows zu testen. Dabei wird geprüft, ob Authentifizierung, Rechteprüfung, Datenvalidierung und Datenbankzugriffe korrekt zusammenspielen.

Als Zielwert für die Testabdeckung wurde in der Vitest-Konfiguration ein Coverage-Ziel von 60 % definiert. Die bisher getesteten Kernmodule erreichen bereits deutlich höhere Werte zwischen 87 % und 100 %.

---

## 2. Eingesetzte Testwerkzeuge und Konfiguration

Für die automatisierte Testumgebung wurden folgende Pakete installiert:

```text
vitest@1.6.0
@vitest/ui@1.6.0
@vitest/coverage-v8@1.6.0
@testing-library/react@16.3.2
@testing-library/jest-dom@6.9.1
@vitejs/plugin-react@4.3.4
happy-dom@14.12.3
vite@5.4.11
```

Die verwendeten Versionen sind mit Node.js 18 kompatibel.

Zusätzlich wurden folgende Konfigurationsdateien erstellt:

```text
vitest.config.ts
test/setup.ts
```

In `package.json` wurden neue Testskripte ergänzt:

```json
"test": "vitest",
"test:ui": "vitest --ui",
"test:coverage": "vitest --coverage",
"test:run": "vitest run"
```

Damit können Tests sowohl im Watch-Modus, über eine UI, mit Coverage-Auswertung oder einmalig im CI-kompatiblen Modus ausgeführt werden.

---

## 3. Umgesetzte Unit-Tests

Aktuell wurden insgesamt **57 Unit-Tests** implementiert. Diese decken vor allem Validierung und kritische Budgetlogik ab.

### 3.1 Authentifizierungs- und Registrierungsvalidierung

Datei:

```text
src/lib/validation/auth.test.ts
```

Anzahl der Tests: **20**

Getestet wird die Validierung von Registrierungsdaten. Dazu gehören:

- E-Mail-Validierung inklusive `trim`, Kleinschreibung und Formatprüfung
- Passwortvalidierung mit Mindestlänge von 8 Zeichen und Maximallänge von 128 Zeichen
- Namensvalidierung mit Mindestlänge, Maximallänge und automatischem Entfernen unnötiger Leerzeichen
- optionale Geburtsdatumsprüfung im Format `DD.MM.YYYY`
- Pflichtfelder und Grenzfälle

Coverage: **100 %**

---

### 3.2 Budget- und Ausgabenvalidierung

Datei:

```text
src/lib/validation/budget.test.ts
```

Anzahl der Tests: **19**

Getestet wird die Validierung beim Erstellen und Aktualisieren von Ausgaben. Dazu gehören:

- Beschreibung einer Ausgabe mit 1 bis 120 Zeichen
- Entfernen unnötiger Leerzeichen
- Prüfung auf leere oder ungültige Beschreibungen
- Validierung von Beträgen in Cent
- Prüfung, dass `amountCents` ein positives ganzzahliges Feld ist
- Validierung der Teilnehmerliste
- mindestens ein Teilnehmer
- keine leeren Teilnehmer-IDs
- Prüfung, dass `createExpenseSchema` und `updateExpenseSchema` identisch funktionieren

Coverage: **100 %**

---

### 3.3 Business-Logik der Budgetverwaltung

Datei:

```text
src/lib/budget/expense-route-helpers.test.ts
```

Anzahl der Tests: **18**

Dieser Testbereich ist besonders wichtig, da hier zentrale Berechnungen der Budgetverwaltung geprüft werden.

Getestete Helper-Funktionen:

```text
centsToAmount()
mapExpenseToResponse()
validateParticipantMembership()
canManageExpense()
calculateBalances()
```

Die Tests prüfen unter anderem:

- Umrechnung von Cent-Beträgen in Euro
- Formatierung von API-Antworten
- Prüfung, ob Teilnehmer tatsächlich Mitglieder der WG sind
- Rechteprüfung für das Bearbeiten oder Verwalten von Ausgaben
- Berechnung von Salden zwischen WG-Mitgliedern

Besonders intensiv wurde `calculateBalances()` getestet. Dabei wurden folgende Fälle berücksichtigt:

- einfacher Fall mit zwei Personen
- ungerade Beträge mit korrekter Cent-Verteilung
- gegenseitige Verrechnung von Schulden
- vollständig ausgeglichene Salden
- Szenarien mit drei oder mehr Personen
- Beibehaltung der Teilnehmerreihenfolge
- Prüfung des Erhaltungsgesetzes: Die Summe aller Schulden muss am Ende 0 ergeben

Coverage: **87 %**

---

## 4. Integrationstests

Zusätzlich zu den Unit-Tests wurden **11 Integrationstests** für die API-Routen der Budgetverwaltung vorbereitet.

Datei:

```text
src/app/api/wgs/[id]/expenses/route.test.ts
```

Diese Tests prüfen den vollständigen Ablauf über die API-Endpunkte:

```text
GET /api/wgs/:id/expenses
POST /api/wgs/:id/expenses
```

Getestete Fälle für `GET`:

- Rückgabe von `401`, wenn der Nutzer nicht authentifiziert ist
- Rückgabe von `403`, wenn der Nutzer kein Mitglied der WG ist
- erfolgreiche Rückgabe einer Ausgabenliste mit berechneten Salden
- Rückgabe eines leeren Arrays, wenn noch keine Ausgaben vorhanden sind

Getestete Fälle für `POST`:

- Rückgabe von `401`, wenn der Nutzer nicht authentifiziert ist
- Rückgabe von `403`, wenn der Nutzer kein WG-Mitglied ist
- Rückgabe von `400` bei ungültigen Eingabedaten
- Rückgabe von `400`, wenn ein angegebener Teilnehmer kein WG-Mitglied ist
- erfolgreiches Erstellen einer Ausgabe
- Erstellen einer Ausgabe nur für den zahlenden Nutzer selbst
- korrektes Speichern der Teilnehmerreihenfolge

Die Integrationstests benötigen eine korrekt konfigurierte Testdatenbank, bevor sie vollständig ausgeführt werden können.

---

## 5. Hilfsdateien für Tests

Für die Integrationstests wurden zusätzliche Hilfsfunktionen vorbereitet.

Datei:

```text
test/helpers/db.ts
```

Enthaltene Funktionen:

```text
cleanupDatabase()
createTestUser()
createTestWG()
createMembership()
createTestSession()
```

Diese Funktionen dienen dazu, Testdaten reproduzierbar zu erzeugen und die Datenbank vor oder nach Tests zu bereinigen.

Zusätzlich wurde eine Testdokumentation erstellt:

```text
test/README.md
```

Diese beschreibt:

- die Teststrategie
- Befehle zum Ausführen der Tests
- Beispiele für neue Tests
- Best Practices für die weitere Testentwicklung

---

## 6. Aktueller Teststatus

Aktuell laufen alle **57 Unit-Tests** erfolgreich durch.

Getestete Module und Coverage:

| Modul | Coverage |
|---|---:|
| `src/lib/validation/auth.ts` | 100 % |
| `src/lib/validation/budget.ts` | 100 % |
| `src/lib/budget/expense-route-helpers.ts` | 87 % |

Befehl zum Ausführen der Unit-Tests:

```bash
npm run test:run src/lib
```

Für eine Coverage-Auswertung kann folgender Befehl genutzt werden:

```bash
npm run test:coverage
```

---

## 7. Geänderte und neue Dateien

Im Rahmen der Testeinrichtung wurden unter anderem folgende Dateien neu erstellt:

```text
vitest.config.ts
test/setup.ts
test/helpers/db.ts
test/README.md
src/lib/validation/auth.test.ts
src/lib/validation/budget.test.ts
src/lib/budget/expense-route-helpers.test.ts
src/app/api/wgs/[id]/expenses/route.test.ts
```

Zusätzlich wurde folgende Datei angepasst:

```text
package.json
```

Dort wurden die benötigten Dev-Dependencies sowie die Testskripte ergänzt.

Insgesamt umfasst der bisherige Testcode ungefähr **700 Zeilen**.

---

## 8. Zusammenfassung

Durch die eingerichtete Testumgebung ist die technische Grundlage für automatisierte Tests im FlatMate-Projekt vorhanden. Besonders wichtige Bereiche wie Eingabevalidierung, Budgetlogik, Rechteprüfung und Schuldenberechnung sind bereits durch Unit-Tests abgesichert.

Die wichtigsten Ergebnisse sind:

- **57 erfolgreich laufende Unit-Tests**
- **11 vorbereitete Integrationstests**
- **100 % Coverage** in den Validierungsmodulen
- **87 % Coverage** in der kritischen Budget-Business-Logik
- vorbereitete Testdatenbank-Hilfsfunktionen für API-Tests
- Vitest-Konfiguration mit Coverage-Ziel von 60 %

Damit ist ein stabiler Ausgangspunkt geschaffen, um weitere Features wie WG-Verwaltung, Putzplan, Einkaufsliste und Authentifizierung schrittweise mit automatisierten Tests abzusichern.
