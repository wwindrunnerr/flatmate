# Beschreibung der Seiten
> * [Home Page](#home-page)
> * [Login Page](#login-page)
> * [Register Page](#register-page)
> * [Benutzer Page](#benutzer-page)


## Home Page
> 1. Die erste Seite, die man sieht ist die Startseite (src/app/page.tsx) 
> 2. Wenn der User noch nicht eingelogt ist, sieht man: 
>    * einen Navbar mit fünf Links (Navbar ist auf jeder Seite sichtbar), 
>    * einen Header 
>    * und einen Link zum Login.
> 3. Wenn man den Link "Login" druckt, kommt man zur Login-Seite (src/app/login/page.tsx) 
> 4. Ist der User schon eingelogt, wird der Link zum Login ausgeblendet.


## Login Page
> 1. Auf dieser Seite befinden sich:
>    * ein Header
>    * 2 input-Felder (E-Mail und Passwort)
>    * ein Button "Anmelden"
>    * und ein Link zur Registration-Seite (src/app/register/page.tsx)
> 2. Wenn man 2 Input-Felder ausfüllt und auf den Button "Anmelden" drückt, wird ein Post-Request an die API (src/app/api/login/route.ts) gesendet.
> 3. Damit wird geprüft, ob ein solcher User in der "Database" (src/app/api/data/users.json) existiert, oder nicht. Wenn ja, wird der User in localStorage hinzugefügt (d.h. eingeloggt).
> 4. Nach dem Login wird der Benutzer zur Benutzer-Page (src/app/dashboard/page.tsx) weitergeleitet.


## Register Page
> 1. Hier sind 5 Input-Felder zu finden:
>    * Name 
>    * Alter
>    * Geschlecht
>    * E-Mail
>    * Passwort 
>      * sowie ein Button "Registrieren"
> 2. Ähnlich wie beim Login-Page wird nach dem Ausfüllen und Drücken ein Post-Request an die API (src/app/api/register/route.ts) gesendet. 
> 3. Dabei wird geprüft, ob der User schon in der "Database" lebt. Falls nicht, wird ein neuer User in die Datei geschrieben.
> 4. Nach dem Registrieren wird der Benutzer zur Benutzer-Page (src/app/dashboard/page.tsx) weitergeleitet.


## Benutzer Page
> 1. Die Seite enthält einen Header "Willkommen, {user.name}"
> 2. Danach ist die Info über:
>   * das Alter {user.age}
>   * den Geschlecht {user.gender}
>   * und die E-Mail  des Users zu finden {user.email}
> 3. Anschließend gibt es einen Button "Abmelden". Wenn man den druckt, wird der User mithilfe von handleLogout Funktion aus localStorage entfernt (ausgeloggt).
