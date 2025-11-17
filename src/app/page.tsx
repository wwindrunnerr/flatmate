"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function MainPage() {
    const [loggedIn, setLoggedIn] = useState(false);

    useEffect(() => {
        setLoggedIn(!!localStorage.getItem("user"));
    }, []);

    return (
        <div className="page">
            <div className="cards-grid">
                {/* --------- BUDGET ---------- */}
                <div className="card">
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

                {/* --------- EINKAUFSLISTE ---------- */}
                <div className="card">
                    <h2>Einkaufsliste</h2>
                    <ul className="list">
                        <li><Link href="#">Wocheneinkauf</Link></li>
                        <li><Link href="#">Putzmittel</Link></li>
                        <li><Link href="#">Vorräte</Link></li>
                    </ul>
                </div>

                {/* --------- PUTZPLAN ---------- */}
                <div className="card">
                    <h2>Noch zum putzen</h2>
                    <div className="row">
                        <span>Bad</span>
                        <input type="checkbox" />
                    </div>
                    <div className="row">
                        <span>Küche</span>
                        <input type="checkbox" defaultChecked />
                    </div>
                </div>

                {/* --------- EVENTS ---------- */}
                <div className="card">
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
                    height: 100%;
                }
                
                .cards-grid {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 24px;
                    width: 100%;
                    height: 100%;
                }

                .card {
                    font-size: 32px;
                    background: #e6e6e6;
                    border-radius: 20px;
                    padding: 24px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    min-height: 220px;
                }

                .card h2 {
                    font-size: 36px;
                    font-weight: 600;
                    margin: 0 0 10px 0;
                    text-decoration: underline;
                }

                .row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 32px;
                    margin-bottom: 4px;
                }

                .list {
                    padding-left: 20px;
                    margin: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .list li a {
                    text-decoration: underline;
                    color: black;
                }

                input[type="checkbox"] {
                    width: 32px;
                    height: 32px;
                }
            `}</style>
        </div>
    );
}
