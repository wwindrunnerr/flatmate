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
        <div className="page">



            <div className="grid">
                {/* --------- BUDGET --------- */}
                <div className="widget">
                    <h2>Budget</h2>
                    <div className="row">
                        <span>Zum Denis</span>
                        <span>78 €</span>
                    </div>
                    <div className="row">
                        <span>Zum Yaroslav</span>
                        <span>67 €</span>
                    </div>
                    <div className="row">
                        <span>Von Mykyta</span>
                        <span>2000 €</span>
                    </div>
                </div>

                {/* --------- EINKAUFSLISTEN --------- */}
                <div className="widget">
                    <h2>Einkaufslisten</h2>
                    <ul>
                        <li><Link href="#">Wocheneinkauf</Link></li>
                        <li><Link href="#">Putzmittel</Link></li>
                        <li><Link href="#">Vorräte</Link></li>
                    </ul>
                </div>

                {/* --------- PUTZPLAN --------- */}
                <div className="widget">
                    <h2>Noch zum putzen</h2>
                    <div className="row checkbox-row">
                        <span>Bad</span>
                        <input type="checkbox" />
                    </div>
                    <div className="row checkbox-row">
                        <span>Küche</span>
                        <input type="checkbox" defaultChecked />
                    </div>
                </div>

                {/* --------- EVENTS --------- */}
                <div className="widget">
                    <h2>Events</h2>

                    <div className="row">
                        <span>Waschtag</span>
                        <span>morgen</span>
                    </div>

                    <div className="row">
                        <span>Hausmeister</span>
                        <span>in 3 Tagen</span>
                    </div>

                    <div className="row">
                        <span>Geburtstag von Denis</span>
                        <span>10.11.2025</span>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .page {
                    padding: 20px 40px;
                    font-family: sans-serif;
                }

                .grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 25px;
                }

                .widget {
                    background: #e5e5e5;
                    border-radius: 15px;
                    padding: 20px;
                }

                .widget h2 {
                    margin-bottom: 15px;
                    text-decoration: underline;
                }

                .row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 10px;
                }

                ul {
                    padding-left: 18px;
                }
                .checkbox-row input {
                    width: 18px;
                    height: 18px;
                }
            `}</style>
        </div>
    );
}
