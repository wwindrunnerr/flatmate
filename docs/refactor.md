## Navigation
> * [Refaktorisierung des Budget Moduls](#refaktorisierung-des-budget-moduls)
> * ...



# Refaktorisierung des Budget Moduls

Im Rahmen der Weiterentwicklung des Projekts *FlatMate* wurde das Budget-Modul implementiert.  
Ein zentraler Bestandteil dieses Moduls sind die API-Routen zur Verwaltung von Ausgaben (`expenses`), insbesondere:

- `wgs/[id]/expenses/route.ts`
- `wgs/[id]/expenses/[expenseId]/route.ts`

## Ziel der Refaktorisierung

Die Refaktorisierung wurde mit folgenden Zielen durchgeführt:

1. **Verbesserung der Lesbarkeit**  
   Der Code sollte für andere Entwickler schneller verständlich sein.

2. **Reduktion von Duplikaten**  
   Wiederholte Logik sollte an zentraler Stelle zusammengeführt werden.

3. **Klare Trennung von Verantwortlichkeiten**  
   API-Routen sollten sich auf den HTTP-Ablauf konzentrieren, während fachliche Hilfslogik ausgelagert wird.

4. **Bessere Erweiterbarkeit**  
   Zukünftige Änderungen, z. B. an Berechtigungen oder an der Balance-Berechnung, sollten einfacher möglich sein.

5. **Reduktion kognitiver Komplexität**  
   Einzelne Funktionen sollten kleiner und leichter nachvollziehbar werden.

## Überblick über die durchgeführten Änderungen

Im Rahmen der Refaktorisierung wurde ein neuer gemeinsamer Helper eingeführt:

- `src/lib/budget/expense-route-helpers.ts`

In diesen Helper wurden wiederverwendbare Funktionen und Typen ausgelagert, die zuvor direkt in den Route-Dateien enthalten waren oder dort mehrfach benötigt wurden.

Die Refaktorisierung umfasste insbesondere:

- Auslagerung gemeinsamer Authentifizierungs- und Membership-Logik,
- Auslagerung der Teilnehmer-Validierung,
- Auslagerung der Berechtigungsprüfung,
- Auslagerung der Response-Mapping-Logik,
- Vereinheitlichung der Prisma-`include`-Definition für Expenses,
- Zerlegung der Balance-Berechnung in kleinere Teilfunktionen,
- Vereinfachung der Route-Dateien selbst.

## 1. Auslagerung gemeinsamer Hilfslogik in ein separates Helper-Modul

Es wurde ein neues Modul `expense-route-helpers.ts` eingeführt.  
Dieses enthält nun unter anderem:

- Typdefinitionen für Expense-bezogene Datenstrukturen,
- die gemeinsame Prisma-`include`-Konfiguration,
- die Membership-Prüfung,
- die Teilnehmer-Validierung,
- die Berechtigungsprüfung,
- die Umwandlung von `Expense`-Objekten in API-Responses,
- die komplette Berechnung der Schulden und Salden.


## 2. Vereinheitlichung der Membership- und Zugriffsprüfung

Die Funktion `requireMembershipOrResponse(wgId)` wurde als gemeinsame Hilfsfunktion zentral verwendet.  
Sie überprüft:

- ob ein Nutzer eingeloggt ist,
- ob er Mitglied der jeweiligen WG ist,
- und liefert entweder:
    - eine standardisierte Fehlermeldung als `NextResponse`, oder
    - die benötigten Benutzer- und Membership-Daten zurück.

Zusätzlich wurde eine weitere Funktion `canManageExpense(...)` eingeführt.  
Diese kapselt die Regel, dass eine Ausgabe nur bearbeitet oder gelöscht werden darf, wenn der aktuelle Nutzer:

- der Ersteller der Ausgabe ist,
- oder die Rolle `ADMIN` besitzt.



## 3. Auslagerung der Teilnehmer-Validierung

Es wurden zwei Hilfsfunktionen eingeführt:

- `loadWgMemberIds(wgId)`
- `validateParticipantMembership(participantUserIds, memberIds)`

Die erste lädt alle Nutzer-IDs der Mitglieder einer WG.  
Die zweite prüft, ob alle ausgewählten Teilnehmer einer Ausgabe tatsächlich Mitglieder derselben WG sind.


## 4. Vereinheitlichung des Response-Mappings

Es wurde eine zentrale Funktion `mapExpenseToResponse(expense)` eingeführt.  
Diese wandelt ein Expense-Datenbankobjekt in die API-Antwortstruktur um.

Dabei werden unter anderem erzeugt:

- `id`
- `description`
- `amountCents`
- `amount`
- `createdAt`
- `paidBy`
- `participantUserIds`
- `participantNames`


## 5. Vereinheitlichung der Prisma-`include`-Konfiguration

### Was wurde geändert?

Die Prisma-`include`-Struktur für `Expense`-Abfragen wurde in eine gemeinsame Konstante `expenseInclude` ausgelagert.

Diese definiert einheitlich, dass geladen werden:

- `paidBy`
- `participants`
- inklusive der zugehörigen `user`-Daten.


## 6. Refaktorisierung der Balance-Berechnung

Die ursprüngliche Funktion `calculateBalances(...)` war funktional korrekt, aber relativ komplex.  
In einer einzigen Funktion wurden mehrere fachliche Schritte miteinander kombiniert:

1. Aufbau einer Benutzer-Mapping-Struktur,
2. Sortierung der Teilnehmer,
3. Verteilung der Kostenanteile,
4. Aufbau gerichteter Schulden,
5. Verrechnung gegenläufiger Schulden,
6. Ableitung der userbezogenen Zusammenfassung.

Dadurch war die Funktion zwar noch lesbar, aber bereits deutlich schwerer zu verstehen als nötig.

Die Berechnung wurde in mehrere kleinere Teilfunktionen zerlegt:

- `splitAmountCents(...)`
- `addUsersFromExpense(...)`
- `buildDirectedBalances(...)`
- `buildPairwiseBalances(...)`
- `buildCurrentUserSummary(...)`
- `calculateBalances(...)` als orchestrierende Hauptfunktion



## 7. Vereinfachung der Route-Dateien

Die beiden Route-Dateien wurden deutlich schlanker aufgebaut.

#### `wgs/[id]/expenses/route.ts`
Diese Datei enthält jetzt im Wesentlichen:

- Membership-Check,
- Request-Validierung,
- Laden oder Speichern von Daten,
- Rückgabe standardisierter Responses.

#### `wgs/[id]/expenses/[expenseId]/route.ts`
Diese Datei enthält jetzt im Wesentlichen:

- Membership-Check,
- Berechtigungsprüfung,
- Validierung,
- Update oder Delete,
- Rückgabe standardisierter Responses.





## Ergebnis der Refaktorisierung
Durch die Refaktorisierung wurde der Code des Budget-Moduls in mehreren Punkten verbessert:
- bessere Lesbarkeit,
- geringere Duplikation,
- klarere Verantwortlichkeiten,
- einfachere Erweiterbarkeit,
- zentralisierte fachliche Regeln,
- verständlichere Struktur der Route-Dateien,
- reduzierte Komplexität der Balance-Berechnung.

