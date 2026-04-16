# UC1 – WG anlegen

## Akteur(e)
Admin

## Kurzbeschreibung
Ein eingeloggter Benutzer erstellt eine neue WG. Nach erfolgreicher Erstellung wird ihm automatisch die Admin-Rolle für diese WG zugewiesen.

## Relevante User Stories
- US_1 – WG-Online-Room anlegen und Bewohner einladen
- US_2 – Adminrechte und Rollenverwaltung

## Voraussetzungen (Precondition)
- Benutzer ist eingeloggt.

## Hauptablauf
1. Der Benutzer wählt die Funktion „WG anlegen“ aus.
2. Der Benutzer gibt einen Namen für die WG ein.
3. Das System prüft die Eingabe.
4. Das System erstellt die WG.
5. Das System weist dem Ersteller automatisch die Admin-Rolle zu.
6. Das System bestätigt die erfolgreiche Erstellung.

## Alternativ-/Fehlerablauf (Exception)
- Der eingegebene Name ist ungültig oder leer.
  - Das System zeigt eine Fehlermeldung an.
  - Der Vorgang wird abgebrochen.
  - Es wird keine WG erstellt.

## Nachbedingungen (Postcondition)
- Die WG existiert.
- Der Ersteller ist Admin der WG.

## Geschätzter Aufwand
- mittel

## UC1 Diagramm:
![UCD1.png](https://github.com/wwindrunnerr/flatmate/blob/main/docs/UMLs/Anwendungsfalldiagramme/UCD1.png)
