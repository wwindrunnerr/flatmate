# FlatMate
## Softwareanforderungen
> Bei dieser Vorlage handelt es sich um eine vereinfachte Version, die auf den Dokumentationsvorlagen von IBM Rational Unified Process (RUP) basiert.

### 1. Einleitung

#### 1.1 Übersicht
> Was sind die Verkaufsargumente bzw. Alleinstellungsmerkmale Ihrer Software?
>

> Die App bietet eine Vielzahl von Funktionen in einer einzigen Anwendung, die für die komfortable Verwaltung einer Wohngemeinschaft erforderlich sind, wie z. B. die Erstellung eines Reinigungsplans, die Erfassung von Ausgaben und Schulden, einen Kalender für wichtige gemeinsame Veranstaltungen und die Erstellung einer Einkaufsliste, die für alle Mitglieder der Gruppe sichtbar ist.

#### 1.2 Geltungsbereich
> Was wird in diesem Dokument behandelt (nicht behandelt)? Ist es für Ihr gesamtes System oder ein Subsystem? Deckt es sowohl funktionale als auch nicht-funktionale Anforderungen ab? (Werden Sie einige Anforderungen in ein anderes Dokument auslagern?)

#### 1.3 Definitionen, Akronyme und Abkürzungen
> Definitionen aller Begriffe, Akronyme und Abkürzungen, die für die ordnungsgemäße Interpretation dieses Dokuments erforderlich sind.

| Abbrevation | Explanation                            |
| ----------- | -------------------------------------- |
| SRS         | Software Requirements Specification    |
| UC          | Use Case                               |
| n/a         | not applicable                         |
| tbd         | to be determined                       |
| UCD         | overall Use Case Diagram               |
| FAQ         | Frequently asked Questions             |


#### 1.4 Referenzen
> Eine vollständige Liste aller referenzierten Dokumente. Jedes Dokument sollte anhand von Titel, Datum und Veröffentlichungsorganisation identifiziert werden. Sie können auch Hyperlinks einfügen, um die Referenzen bequem zu öffnen.



| Title                                                                  | Date       |
|------------------------------------------------------------------------|:----------:|
| [FlatMate Blog](https://github.com/wwindrunnerr/flatmate/discussions/) | 02.10.2025 |
| [GitHub](https://github.com/wwindrunnerr/flatmate)                     | 02.10.2025 |

### 2. Funktionale Anforderungen
> Dieser Abschnitt enthält alle Softwareanforderungen in einem ausreichenden Detaillierungsgrad, damit Designer ein System entwerfen können, das diese Anforderungen erfüllt, und Tester testen können, ob das System diese Anforderungen erfüllt.
> Dieser Abschnitt ist normalerweise nach Funktionen geordnet, es können jedoch auch alternative Gliederungen geeignet sein, beispielsweise die Gliederung nach Benutzer oder die Gliederung nach Subsystem.

> [HINWEIS:]
> Sie können Links zu Ihren UML-Diagrammen und User Stories oder die Bezeichnungen der User Stories in dieses Dokument einfügen.



#### 2.1 Übersicht
> Eine kurze Beschreibung der Funktionalität Ihrer Anwendung.
> Fügen Sie ein oder mehrere **UML-Anwendungsfalldiagramme** und die erforderliche Beschreibung hinzu, um die wichtigsten Anwendungsfälle Ihrer Anwendung wiederzugeben.

| ID  | Anforderung                            | Beschreibung                                                                                  | Priorität    |
|-----|----------------------------------------|-----------------------------------------------------------------------------------------------|--------------|
| F01 | Webapp                                 | Die Anwendung soll über den Browser zugänglich und responsiv gestaltet sein (Desktop & Mobil) | 🔴 Sehr hoch |
| F02 | Putzplan                               | Erstellung, Zuweisung und Verwaltung von Reinigungsaufgaben für WG-Mitglieder                 | 🔴 Sehr hoch |
| F03 | Budgetverwaltung                       | Erfassung und Aufteilung gemeinsamer Ausgaben, automatische Schuldenberechnung                | 🔴 Sehr hoch |
| F04 | Einkaufsliste                          | Gemeinsame Liste zum Hinzufügen, Bearbeiten und Abhaken von Artikeln                          | 🔴 Sehr hoch |
| F05 | Account erstellen / Login-System       | Nutzer*innen können persönliche und WG-Accounts erstellen und verwalten                       | 🔴 Sehr hoch |
| F06 | WG-Account erstellen                   | Möglichkeit, WG-spezifische Gruppen zu verwalten und Mitglieder hinzuzufügen                  | 🟠 Hoch      |
| F07 | Pinnwand / Kommentare                  | WG-Mitglieder können Ideen, Notizen oder Aufgabenkommentare posten                            | 🟠 Hoch      |
| F08 | Kalender für WG-Events                 | Planung und Anzeige gemeinsamer Termine (Meetings, Geburtstage, Besucher)                     | 🟠 Hoch      |
| F09 | Inventarverwaltung                     | Übersicht über gemeinsame Gegenstände und deren Zustand                                       | 🟠 Hoch      |
| F10 | Benachrichtigungen                     | Automatische Erinnerungen bei Aufgaben, Terminen oder Budget-Updates                          | 🟠 Hoch      |
| F11 | Nebenkostentracker                     | Verwaltung und Nachverfolgung von Nebenkostenabrechnungen                                     | 🟠 Hoch      |
| F12 | Wunschliste                            | Sammlung gemeinsamer Anschaffungswünsche mit Abstimmungsfunktion                              | 🟡 Mittel    |
| F13 | Besucher anmelden                      | Möglichkeit, Gäste zu registrieren oder Besuche zu planen                                     | 🟡 Mittel    |
| F14 | WG-Challenges & Punktesystem           | Gamification-Elemente zur Motivation (z. B. Streaks, Sterne)                                  | 🟡 Mittel    |
| F15 | Mietmanagement                         | Verwaltung von Mietzahlungen und Terminen                                                     | ⚪ Niedrig    |
| F16 | WG-Playlist (Spotify/YouTube)          | Gemeinsame Playlist für Musik im Haushalt                                                     | ⚪ Niedrig    |
| F17 | Rezepte / Kooperation mit Edens Gruppe | Integration von Rezeptideen oder Kochfunktionen                                               | ⚪ Niedrig    |
| F18 | Werbung einbinden                      | Anzeigenplatzierung zur Monetarisierung                                                       | ⚪ Niedrig    |
| F19 | Offline-Modus                          | Nutzung zentraler Funktionen auch ohne Internetverbindung                                     | ⚪ Niedrig    |

#### F01 Webapp
> Spezifizieren Sie diese Funktion/diesen Anwendungsfall durch:
> - Relevante **User Stories**
> - **UI-Mockups**
> - **UML-Verhaltensdiagramme** und notwendige Textspezifikation
> - **Voraussetzungen**. *Eine Voraussetzung für einen Anwendungsfall ist der Zustand des Systems, der vorliegen muss, bevor ein Anwendungsfall ausgeführt wird.*
> - **Nachbedingungen**. *Eine Nachbedingung eines Anwendungsfalls ist eine Liste möglicher Zustände, in denen sich das System unmittelbar nach Abschluss eines Anwendungsfalls befinden kann.*
> - **Geschätzter Aufwand (hoch, mittel, niedrig)**

![Mocup_mainPage.png](Mocup_mainPage.png)

#### F02 Putzplan

![Mocup_Putzplan.png](Mocup_Putzplan.png)

#### F03 Budgetverwaltung

![Mocup_Budget.png](Mocup_Budget.png)
#### F04 Einkaufsliste

![Mocup_Einkaufsliste.png](Mocup_Einkaufsliste.png)
#### F05 Account erstellen / Login-System

![Mocup_User.png](Mocup_User.png)
### 3. Nicht-funktionale Anforderungen

> [WICHTIG:]
> Es ist nicht notwendig, alle der folgenden Kategorien abzudecken. Konzentrieren Sie sich auf das, was Sie in Ihrem Projekt umsetzten werden.
> Wenn einige nicht-funktionale Anforderungen als User Stories in Ihrem Backlog beschrieben werden, fügen Sie deren **Links** in diesem Abschnitt hinzu oder beliebige Informationen, die den Leser bei der Suche nach ihnen in Ihrem Backlog unterstützen, z.B. die **Bezeichnung** der relevanten User Story.

> Kategorien: Benutzerfreundlichkeit, Zuverlässigkeit, Leistung, Effizienz, Integrität, Wartbarkeit, Flexibilität, Testbarkeit, Wiederverwendbarkeit, Sicherheit.


### 4. Technische Einschränkungen
> Geben Sie alle wichtigen Einschränkungen, Annahmen oder Abhängigkeiten an, z. B. alle Einschränkungen darüber, welcher Servertyp verwendet werden soll, welche Art von Open-Source-Lizenz eingehalten werden muss usw.