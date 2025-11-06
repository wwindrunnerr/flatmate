"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function MainPage() {
    // eine Variable, die am Anfang false ist
    const [loggedIn, setLoggedIn] = useState(false);

    // die Funktion wird beim Laden der Seite aufgerufen
    useEffect(() => {
        // !! konvertiert den Wert in einen booleschen Wert, wenn der User in localStorage ist
        setLoggedIn(!!localStorage.getItem("user"));
    }, []);


    // wenn nicht eingeloggt (!loggedIn), dann Login-Link anzeigen
    return (
        <div>
            <h2>Main Page</h2>
            {!loggedIn && <Link href="/login">Login</Link>}
        </div>
    );
}
