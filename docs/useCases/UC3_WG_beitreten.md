# UC3 – WG beitreten

## Akteur(e)
Bewohner

## Kurzbeschreibung
Ein Benutzer tritt einer bestehenden WG über einen gültigen Einladungslink oder Einladungscode bei und wird anschließend als Bewohner der WG aufgenommen.

## Relevante User Stories
- US_1 – WG-Online-Room anlegen und Bewohner einladen
- US_2 – Adminrechte und Rollenverwaltung

## Voraussetzungen (Precondition)
- Ein gültiger Einladungslink oder Einladungscode liegt vor.
- Der Benutzer ist eingeloggt oder registriert sich im Rahmen des Beitritts.
- Die zugehörige WG existiert.

## Hauptablauf
1. Der Benutzer öffnet den Einladungslink oder gibt den Einladungscode ein.
2. Das System prüft, ob der Link oder Code gültig und nicht abgelaufen ist.
3. Das System zeigt die zugehörige WG an.
4. Der Benutzer bestätigt den Beitritt.
5. Das System fügt den Benutzer der WG hinzu.
6. Das System weist dem Benutzer die Rolle „Bewohner“ zu.
7. Das System bestätigt den erfolgreichen Beitritt.

## Alternativ-/Fehlerablauf (Exception)
- Der Einladungscode oder Einladungslink ist ungültig oder abgelaufen.
  - Das System zeigt eine Fehlermeldung an.
  - Der Beitritt wird nicht durchgeführt.

## Nachbedingungen (Postcondition)
- Der Benutzer ist Mitglied der WG.
- Der Benutzer besitzt die Rolle „Bewohner“.

## Zugehöriges Anwendungsfalldiagramm
- UCD3 – WG beitreten

## Geschätzter Aufwand
- mittel

## UC3 Diagramm:
![UCD3.png](https://github.com/wwindrunnerr/flatmate/blob/main/docs/UMLs/Anwendungsfalldiagramme/UCD3.png)
