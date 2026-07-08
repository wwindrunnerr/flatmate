# Technisches Review-Protokoll – FlatMate

## Metadaten

| Feld | Inhalt |
|---|---|
| **Datum** | 12. Mai 2026 |
| **Startzeit** | 14:00 Uhr |
| **Endzeit** | 15:30 Uhr |
| **Ort** | Online / gemeinsamer Call |

## Teilnehmende

| Name | Rolle |
|---|---|
| Leon | Moderator – achtet auf Zeit, moderiert Diskussionen, wahrt fachliche Atmosphäre |
| Kim | Protokollführerin – notiert und klassifiziert alle gefundenen Fehler |
| Denis | Autor – hat am reviewten Code mitgeschrieben, beantwortet inhaltliche Fragen |
| Yaroslav | Leser / Inspektor – führt durch den Code, liest zu prüfende Stellen vor |
| Mykyta | Weiterer Inspektor – prüft auf Architektur-Richtlinien und Usability |

---

## Ziel und Schwerpunkt des Reviews

Das Ziel des Reviews war es, die **Frontend-Abrechnungslogik (`kosten/page.tsx`)** und ihre **Einbindung ins WG-Dashboard** zu überprüfen.

Dieser Codebereich wurde ausgewählt, weil:
- die Berechnung von Ausgaben und Schulden eine **Kernfunktion** der WG-App ist,
- Ungenauigkeiten bei Cent-Beträgen direkt zu Nutzerfrust führen würden,
- die Datei in kurzer Zeit stark gewachsen war und eine erhöhte Fehleranfälligkeit vermuten ließ.

---

## Reviewte Komponenten

| Komponente | Beschreibung |
|---|---|
| `src/app/wg/[id]/kosten/page.tsx` | KostenPage – inklusive Formular-Validierung und API-Calls |
| `src/app/wg/[id]/WGDashboard.tsx` | Finanz-Sektion im WG-Dashboard |
| Hilfsfunktionen | u. a. `formatEuro`, `calculateBalances` (in `expense-route-helpers.ts`) |

---

## Kriterien für den Review

| Kriterium | Beschreibung |
|---|---|
| **Codequalität & Wartbarkeit** | Einhaltung des Single Responsibility Principle (SRP), Vermeidung von Redundanzen (DRY) |
| **Sicherheit** | Validierung der Bearbeitungs- und Löschrechte (Client vs. Server) |
| **Leistung & Stabilität** | Robustheit der Berechnungen und Fehlerbehandlung bei API-Aufrufen |

---

## Review-Methodik

Wir haben die **formale Inspektion in Sitzungstechnik** gewählt. Yaroslav führte als Leser strukturiert durch den Code, während die übrigen Teilnehmenden anhand einer vorbereiteten Checkliste für die React-/TypeScript-Architektur jede Auffälligkeit gemeinsam bewertet haben.

---

## Ergebnisse der Sitzung

### Gefundene Fehler / Auffälligkeiten

#### 1. Code-Duplikate – Verstoß gegen DRY-Prinzip

**Beschreibung:** Die Hilfsfunktion `formatEuro` war in zwei Dateien exakt identisch vorhanden (`kosten/page.tsx` und `WGDashboard.tsx`). Das erzeugte unnötigen Ballast und erschwerte spätere Änderungen (z. B. Wechsel auf ein anderes Währungsformat).

**Schweregrad:** Mittel

**Verantwortliche Person:** Denis

**Maßnahme:** Erstellung einer gemeinsamen Datei `src/lib/utils.ts`, die `formatEuro` zentral exportiert. Beide Dateien importieren die Funktion künftig von dort.

**Frist:** 15.05.2026

**Status:** Umgesetzt – `src/lib/utils.ts` wurde erstellt, lokale Definitionen entfernt.

---

#### 2. Architektur-Problem – Zu hohe Komplexität der `KostenPage`

**Beschreibung:** Die Datei `kosten/page.tsx` umfasst ca. 500 Zeilen und übernimmt gleichzeitig UI-Darstellung, Datenabruf und Formularvalidierung. Das erschwert die Lesbarkeit für alle Teammitglieder und verletzt das Single Responsibility Principle.

**Schweregrad:** Mittel

**Verantwortliche Person:** Leon

**Maßnahme:** Anlage eines Tickets im Scrum-Board mit dem Ziel, die KostenPage in einem der nächsten Sprints in kleinere Custom Hooks (z. B. `useExpenses`) aufzuteilen.

**Frist:** 15.05.2026

**Status:** Ticket angelegt – Umsetzung für späteren Sprint geplant. Eine sofortige Umstrukturierung kurz vor der Abgabe wäre zu riskant.

---

#### 3. Fehlende native HTML-Validierung am Betragsfeld

**Beschreibung:** Das Input-Feld für Beträge (`amountInput`) hatte kein `type="number"`, kein `min` und kein `step`. Das ermöglichte unnötige Fehleingaben auf Nutzerseite.

**Schweregrad:** Niedrig

**Verantwortliche Person:** Mykyta

**Maßnahme:** Ergänzung der Attribute `type="number"`, `min="0.01"` und `step="0.01"` am Eingabefeld.

**Frist:** 19.05.2026

**Status:** Umgesetzt – Attribute wurden in `kosten/page.tsx` ergänzt.

---

### Bewährte Praktiken

- **Konsequente und saubere Typisierung in TypeScript** – Strukturen wie `WGResponse` oder `Expense` machen den Datenfluss schnell verständlich und Fehler früh erkennbar.
- **Klare Trennung zwischen Cent-Beträgen (Logik) und Euro-Beträgen (Darstellung im UI)** – hat sich als optimal für Finanzdaten erwiesen und sollte für alle zukünftigen Finanzfunktionen beibehalten werden.

### Gelernte Lektionen

- Grundlegende Funktionen wie Währungsformatierungen **von Anfang an in zentrale Dateien auslagern**, statt sie mehrfach zu kopieren. Auch wenn man im Flow ist und schnell vorankommen möchte, verhindert das unnötige „Copy-&-Paste-Schulden" und hält den Code langfristig sauber und wartbar.
- Reviews **früher im Projektverlauf** ansetzen, damit Architekturprobleme wie die Größe der KostenPage noch vor einer Verfestigung adressiert werden können.
