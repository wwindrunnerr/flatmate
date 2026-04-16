# UC4 – Ausgabe erfassen und aufteilen

## Akteur(e)
Bewohner

## Kurzbeschreibung
Ein Bewohner erfasst eine gemeinsame Ausgabe für die WG, hinterlegt die relevanten Informationen und legt fest, wie die Kosten auf die beteiligten Personen aufgeteilt werden.

## Relevante User Stories
- US_5 – Kosten erfassen und fair aufteilen

## Voraussetzungen (Precondition)
- Der Nutzer ist Mitglied der WG.
- Der Nutzer ist eingeloggt.
- Die WG existiert.

## Hauptablauf
1. Der Bewohner wählt die Funktion „Ausgabe erfassen“ aus.
2. Der Bewohner gibt Betrag, Zahler, Datum und Notiz ein.
3. Optional lädt der Bewohner ein Belegfoto hoch.
4. Der Bewohner wählt die Art der Aufteilung, z. B. gleichmäßig oder gewichtet.
5. Das System prüft die Eingaben auf Vollständigkeit und Gültigkeit.
6. Der Bewohner speichert die Ausgabe.
7. Das System legt die Ausgabe ab und berechnet die Anteile pro Person.

## Alternativ-/Fehlerablauf (Exception)
- Der Betrag ist ungültig oder erforderliche Felder fehlen.
  - Das System zeigt einen Validierungsfehler an.
  - Die Ausgabe wird nicht gespeichert.

## Nachbedingungen (Postcondition)
- Die Ausgabe ist im System gespeichert.
- Die Anteile pro Person sind berechnet.
- Die WG-Salden können auf Basis der neuen Ausgabe aktualisiert werden.

## Zugehöriges Anwendungsfalldiagramm
- UCD4 – Ausgabe erfassen und aufteilen

## Geschätzter Aufwand
- hoch

## UC4 Diagramm:
![UCD4.png](https://github.com/wwindrunnerr/flatmate/blob/main/docs/UMLs/Anwendungsfalldiagramme/UCD4.png)
