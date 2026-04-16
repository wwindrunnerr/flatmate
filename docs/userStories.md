## US_1 – WG-Online-Room anlegen und Bewohner einladen (5 Story Points)
> Als Bewohner möchte ich einen neuen WG-Room erstellen und Mitbewohner einladen, damit wir alle im selben Space interagieren können.

Definition of Done:
* Eine WG kann erstellt werden.
* Beim Erstellen können Name und optional eine Adresse angegeben werden.
* Es kann ein Einladungslink oder Einladungscode generiert werden.
* Der Beitritt über Link oder Code funktioniert.
* Der Ersteller der WG wird automatisch als Admin gesetzt.
* Fehlerfälle wie ungültige oder abgelaufene Einladungen werden verständlich angezeigt.


## US_2 – Adminrechte und Rollenverwaltung (5 Story Points)
> Als Admin möchte ich Rollen und Rechte verwalten, damit nur autorisierte Personen sensible Aktionen ausführen können.

Definition of Done:
* Es gibt mindestens zwei Rollen: Admin und Bewohner.
* Nur Admins dürfen:
* Einladungen widerrufen,
* WG-Einstellungen ändern,
* Nutzer aus der WG entfernen.
* Bewohner ohne Adminrechte können diese Aktionen nicht ausführen.
* Rechte werden sowohl im Frontend als auch im Backend korrekt geprüft.


## US_3 – Aufgaben- und Putzplan (8 Story Points)
> Als WG-Bewohner möchten wir wiederkehrende Aufgaben rotierend verteilen, damit die Arbeit fair aufgeteilt ist.

Definition of Done
* Aufgaben können angelegt werden.
* Für jede Aufgabe können Titel, Frequenz (wöchentlich, 14-tägig, monatlich), Teilnehmer und Startwoche definiert werden.
* Die Zuständigkeit rotiert automatisch pro Periode.
* Es wird klar angezeigt, wer aktuell für eine Aufgabe zuständig ist.
* Aufgaben können als erledigt markiert werden.
* Verspätete oder offene Aufgaben sind sichtbar gekennzeichnet.


## US_4 – Gemeinsamer Kalender mit Terminen und Erinnerungen (8 Story Points)
> Als Bewohner möchte ich WG-Termine sehen und verwalten, damit alle rechtzeitig informiert sind.

Definition of Done: 
* Termine können erstellt werden.
* Ein Termin enthält mindestens Datum, Uhrzeit sowie optional Ort und Notizen.
* Alle WG-Mitglieder können die Termine der WG sehen.
* Erinnerungen, z. B. 24 Stunden vorher, können pro Nutzer aktiviert oder deaktiviert werden.
* Änderungen an Terminen werden für alle Mitglieder aktuell dargestellt.


## US_5 – Kosten erfassen und fair aufteilen (13 Story Points)
> Als Bewohner möchte ich Ausgaben erfassen und fair aufteilen, damit Salden innerhalb der WG transparent bleiben.

Definition of Done: 
* Ausgaben können erfasst werden.
* Eine Ausgabe enthält Betrag, Zahler, Kategorie, Datum und Notiz.
* Optional kann ein Foto des Belegs hochgeladen werden.
* Ausgaben können aufgeteilt werden als:
* gleichmäßig,
* gewichtet,
* benutzerdefinierte Anteile.
* Die resultierenden Salden werden korrekt berechnet.
* Es gibt eine Historie bzw. Audit-Funktion, die zeigt, wer was wann geändert hat.


## US_ 6 – Ausgleich und Zahlungstracking (8 Story Points)
> Als Bewohner möchte ich offene Beträge ausgleichen und Zahlungen markieren, damit Schulden transparent abgebaut werden können.

Definition of Done:
* Es werden Vorschläge für einen Ausgleich mit möglichst wenigen Zahlungen berechnet.
* Zahlungen können als gezahlt oder erhalten markiert werden.
* Zu Zahlungen kann ein Datum hinterlegt werden.
* Schuldner können erinnert werden.
* Erinnerungen können stummgeschaltet werden.
* Änderungen werden protokolliert.
* Salden aktualisieren sich sofort nach einer Änderung.

## US_7 – Einkaufsliste gemeinsam verwalten (5 Story Points)
> Als Bewohner möchte ich Artikel zur gemeinsamen Einkaufsliste hinzufügen, bearbeiten und abhaken, damit Einkäufe in der WG koordiniert und transparent organisiert werden können.

Definition of Done:
* Artikel können hinzugefügt werden.
* Artikel können bearbeitet werden.
* Artikel können als erledigt markiert werden.
* Änderungen sind für alle WG-Mitglieder sichtbar.
* Ungültige Eingaben werden verständlich angezeigt.