# UC6 – Einkaufsliste

## UC6a – Artikel hinzufügen und bearbeiten

### Akteur(e)
Bewohner

### Kurzbeschreibung
Ein Bewohner fügt einen neuen Artikel zur gemeinsamen Einkaufsliste hinzu oder bearbeitet einen bereits vorhandenen Eintrag, damit die Liste aktuell und für alle WG-Mitglieder nutzbar bleibt.

### Relevante User Stories
- US_7 – Einkaufsliste gemeinsam verwalten

### Voraussetzungen (Precondition)
- Der Benutzer ist Mitglied der WG.
- Der Benutzer ist eingeloggt.
- Die WG existiert.

### Hauptablauf
1. Der Bewohner öffnet die Einkaufsliste.
2. Der Bewohner fügt einen neuen Artikel hinzu oder wählt einen bestehenden Artikel zur Bearbeitung aus.
3. Der Bewohner gibt die Artikeldaten ein bzw. ändert diese.
4. Das System prüft die Eingaben.
5. Der Bewohner speichert die Änderungen.
6. Das System aktualisiert die Einkaufsliste.

### Alternativ-/Fehlerablauf (Exception)
- Der Artikelname ist ungültig oder leer.
  - Das System zeigt eine Fehlermeldung an.
  - Der Artikel wird nicht gespeichert.

### Nachbedingungen (Postcondition)
- Der Artikel ist in der Einkaufsliste gespeichert oder aktualisiert.
- Die Liste ist für die WG-Mitglieder auf dem aktuellen Stand.

### Zugehöriges Anwendungsfalldiagramm
- UCD6 – Einkaufsliste

### Geschätzter Aufwand
- mittel


## UC6b – Artikel abhaken

### Akteur(e)
Bewohner

### Kurzbeschreibung
Ein Bewohner markiert einen Artikel in der gemeinsamen Einkaufsliste als erledigt, damit alle WG-Mitglieder sehen können, dass dieser bereits besorgt wurde.

### Relevante User Stories
- US_7 – Einkaufsliste gemeinsam verwalten

### Voraussetzungen (Precondition)
- Der Benutzer ist Mitglied der WG.
- Der Benutzer ist eingeloggt.
- In der Einkaufsliste existiert mindestens ein Artikel.

### Hauptablauf
1. Der Bewohner öffnet die Einkaufsliste.
2. Der Bewohner wählt einen Artikel aus.
3. Der Bewohner markiert den Artikel als erledigt.
4. Das System speichert die Änderung.
5. Das System aktualisiert die Liste.

### Alternativ-/Fehlerablauf (Exception)
- Der Artikel ist bereits als erledigt markiert.
  - Das System zeigt einen Hinweis an.
  - Es erfolgt keine weitere Änderung.

### Nachbedingungen (Postcondition)
- Der Artikel ist als erledigt markiert.
- Die Einkaufsliste ist aktualisiert.

### Zugehöriges Anwendungsfalldiagramm
- UCD6 – Einkaufsliste

### Geschätzter Aufwand
- niedrig bis mittel

### UC6 Diagramm:
![UCD6.png](/docs/UMLs/Anwendungsfalldiagramme/UCD6.png)
