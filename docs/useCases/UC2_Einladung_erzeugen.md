# UC2 – Einladung erzeugen

## Akteur(e)
Admin

## Kurzbeschreibung
Ein Admin erzeugt für eine bestehende WG einen Einladungslink oder Einladungscode, damit weitere Bewohner der WG beitreten können.

## Relevante User Stories
- US_1 – WG-Online-Room anlegen und Bewohner einladen
- US_2 – Adminrechte und Rollenverwaltung

## Voraussetzungen (Precondition)
- Die WG existiert.
- Der Admin ist Mitglied dieser WG.
- Der Benutzer ist eingeloggt.

## Hauptablauf
1. Der Admin wählt die Funktion „Einladen“ aus.
2. Das System prüft, ob der Benutzer die nötigen Rechte besitzt.
3. Das System generiert einen gültigen Einladungslink oder Einladungscode.
4. Das System zeigt den generierten Link oder Code an.
5. Der Admin teilt den Link oder Code mit der einzuladenden Person.

## Alternativ-/Fehlerablauf (Exception)
- Das Invite-Limit wurde erreicht.
  - Das System zeigt einen Hinweis an.
  - Es wird kein neuer Einladungslink oder Code erzeugt.

## Nachbedingungen (Postcondition)
- Ein gültiger Einladungslink oder Einladungscode existiert.
- Die Einladung ist zeitlich begrenzt gültig (z. B. 7 Tage).

## Zugehöriges Anwendungsfalldiagramm
- UCD2 – Einladung erzeugen

## Geschätzter Aufwand
- mittel

## UC2 Diagramm:
![UCD2.png](https://github.com/wwindrunnerr/flatmate/blob/main/docs/UMLs/Anwendungsfalldiagramme/UCD2.png)
