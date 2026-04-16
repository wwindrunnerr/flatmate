# UC7 – Putzplan

## Akteur(e)
Admin

## Kurzbeschreibung
Ein Admin erstellt für die WG einen Putzplan, legt den Zeitraum und die anfallenden Aufgaben fest und weist diese den Bewohnern zu, damit die Haushaltsaufgaben organisiert und transparent verteilt sind.

## Relevante User Stories
- US_3 – Aufgaben- und Putzplan
- US_2 – Adminrechte und Rollenverwaltung

## Voraussetzungen (Precondition)
- Die WG existiert.
- Der Admin ist Mitglied dieser WG.
- Der Benutzer ist eingeloggt.
- Es sind Bewohner in der WG vorhanden, denen Aufgaben zugewiesen werden können.

## Hauptablauf
1. Der Admin wählt die Funktion „Putzplan erstellen“ aus.
2. Der Admin legt den Zeitraum fest, z. B. Woche oder Monat.
3. Der Admin definiert die anfallenden Aufgaben, z. B. Bad putzen oder Müll rausbringen.
4. Der Admin weist die Aufgaben den Bewohnern zu.
5. Der Admin speichert den Putzplan.
6. Das System speichert den Plan und macht ihn für die WG-Mitglieder sichtbar.

## Alternativ-/Fehlerablauf (Exception)
- Es sind keine Bewohner verfügbar.
  - Das System zeigt einen Hinweis an.
  - Der Putzplan kann nicht sinnvoll erstellt werden.

- Der gewählte Zeitraum ist ungültig.
  - Das System zeigt eine Fehlermeldung an.
  - Der Vorgang wird abgebrochen.
  - Es wird kein Putzplan gespeichert.

## Nachbedingungen (Postcondition)
- Der Putzplan ist gespeichert.
- Der Putzplan ist für alle WG-Mitglieder sichtbar.
- Die Aufgaben sind Bewohnern zugewiesen.

## Zugehöriges Anwendungsfalldiagramm
- UCD7 – Putzplan

## Geschätzter Aufwand
- mittel bis hoch

### UC7 Diagramm:
![UCD7.png](/docs/UMLs/Anwendungsfalldiagramme/UCD7.png)
