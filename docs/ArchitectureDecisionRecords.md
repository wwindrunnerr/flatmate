# Inhalt
> * [ARD1 Architekturstil](#ARD1-Architekturstil)
> * [ARD2 Datenbank](#ARD2-Datenbank)
> * [ARD3 Authentifizierung](#ARD3-Authentifizierung)
> * [ARD4 Ordnerstruktur](#ARD4-Ordnerstruktur)


> # ARD1 Architekturstil
## Kontext und Problemstellung

- Das Team benötigt eine Architektur, die schnell entwickelbar ist, wenig Deploy-Overhead hat und sich gut für ein kleines Team eignet. 
- Gleichzeitig müssen zentrale Features wie WG-Verwaltung, Budgetverwaltung und Einkaufsliste innerhalb eines Systems konsistent sein.


## Betrachtete Varianten

* Microservices
* Servicebasierte Architektur
* Monolith (Next.js)

## Entscheidung

Gewählte Variante: “Monolith (Next.js)“, denn sie bietet die beste Balance für ein kleines Team, minimale Komplexität und eine schnelle Entwicklung. Microservices wären überdimensioniert.

## Status
Angenommen

## Konsequenzen
* Gut, weil geringe Komplexität, einfacher zu deployen, schnelle Änderungen
* Gut, weil alle Features in einem konsistenten Code-Kontext liegen
* Schlecht, weil begrenzte horizontale Skalierbarkeit
* Schlecht, weil Module teilen sich Infrastruktur


> # ARD2 Datenbank
## Kontext und Problemstellung

* Die App benötigt relationale Daten mit klaren Beziehungen: WGs → Mitglieder, Mitglieder → Ausgaben → Schulden. 
* Budgetverwaltung erfordert Transaktionen und starke Konsistenz.


## Betrachtete Varianten

* PostgreSQL 
* MongoDB 
* SQLite 
* Prisma


## Entscheidung

Gewählte Variante: PostgreSQL, denn es bietet starke Konsistenz, performante Joins, ACID-Transaktionen und ist ideal für relational strukturierte Daten.

## Status
Angenommen

## Konsequenzen
* Gut, weil ACID-Transaktionen Schulden-Berechnung stabil machen 
* Gut, weil klare Foreign-Keys garantieren Konsistenz 
* Schlecht, weil höhere Komplexität als NoSQL 
* Schlecht, weil migrationsabhängiger Entwicklungsprozess

> # ARD3 Authentifizierung
## Kontext und Problemstellung

* Das System erfordert sichere Logins, Admin-Rechte pro WG und Schutz sensibler Daten (Emails, Einladungslinks). 
* Sessions bieten besseren Schutz gegen Token-Theft bei klassischen Webapps


## Betrachtete Varianten

* JWT Access Tokens 
* Session Cookies 
* OAuth Provider



## Entscheidung

Gewählte Variante: Session Cookies, denn sie sind am sichersten für Browser-Apps ohne komplexes API-Gateway, vermeiden Token-Theft und sind einfach serverseitig invalidierbar


## Status
Angenommen

## Konsequenzen
* Gut, weil sicherer (HttpOnly, nicht auslesbar)
* Gut, weil serverseitiges Session-Invalidieren möglich 
* Schlecht, weil Skalierung braucht Sticky Sessions oder Session Store 
* Schlecht, weil weniger geeignet für reine APIs


> # ARD4 Ordnerstruktur
## Kontext und Problemstellung

Zur Wartbarkeit muss der Code modular sein, so enthält die App klar abgegrenzte Fachdomänen (Budget, Einkaufsliste, Login, WG-Management)


## Betrachtete Varianten

* Layer-Based Modules (Model-View-Controller)
* Feature-Based Folders 
* Domain-Driven Packaging



## Entscheidung

Gewählte Variante: Feature-Based Folders, da jedes Feature (Budget, Einkaufsliste etc.) vollständig gekapselt und unabhängig entwickelt werden kann


## Status
Angenommen

## Konsequenzen
* Gut, weil hohe Kohäsion pro Feature 
* Gut, weil Teams können parallel arbeiten 
* Schlecht, weil Cross-Feature-Kommunikation erfordert klar definierte Services 
* Schlecht, weil globale Logik schwerer sichtbar wird

