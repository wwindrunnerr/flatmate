# UC5 – Salden anzeigen und ausgleichen

## Akteur(e)
Bewohner

## Kurzbeschreibung
Ein Bewohner ruft die Saldenübersicht der WG auf, sieht offene Beträge und mögliche Ausgleichsvorschläge ein und markiert eine Zahlung nach erfolgtem Ausgleich als erledigt.

## Relevante User Stories
- US_6 – Ausgleich und Zahlungstracking
- US_5 – Kosten erfassen und fair aufteilen

## Voraussetzungen (Precondition)
- Mindestens eine Ausgabe existiert.
- Der Nutzer ist Mitglied der WG.
- Der Nutzer ist eingeloggt.
- Für die WG liegen berechenbare Salden vor.

## Hauptablauf
1. Der Bewohner öffnet die Saldenübersicht der WG.
2. Das System berechnet und zeigt die aktuellen Salden an.
3. Das System zeigt passende Ausgleichsvorschläge an.
4. Der Bewohner wählt eine vorgeschlagene oder bereits erfolgte Zahlung aus.
5. Der Bewohner markiert die Zahlung als „erledigt“.
6. Das System protokolliert die Zahlung.
7. Das System aktualisiert die Saldenübersicht.

## Alternativ-/Fehlerablauf (Exception)
- Die Daten sind unvollständig oder eine Berechnung ist nicht möglich.
  - Das System zeigt einen Hinweis an.
  - Die Salden oder Ausgleichsvorschläge können nicht vollständig dargestellt oder aktualisiert werden.

## Nachbedingungen (Postcondition)
- Die Salden sind aktualisiert.
- Die Zahlung ist im System protokolliert.
- Die Übersicht zeigt den aktuellen Stand der offenen Beträge an.

## Zugehöriges Anwendungsfalldiagramm
- UCD5 – Salden anzeigen und ausgleichen

## Geschätzter Aufwand
- hoch


## UC5 Diagramm:
![UCD5.png](https://github.com/wwindrunnerr/flatmate/blob/main/docs/UMLs/Anwendungsfalldiagramme/UCD5.png)
