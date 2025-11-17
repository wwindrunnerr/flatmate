"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import "./home.css";

export default function LandingPage() {
    const [loggedIn, setLoggedIn] = useState(false);

    useEffect(() => {
        setLoggedIn(!!localStorage.getItem("user"));
    }, []);

    return (
        <main className="home-page">
            <div className="home-card">
                <h1 className="home-title">Willkommen in der WG-App</h1>
                <p className="home-subtitle">
                    Verwalte Budget, Einkaufsliste und Putzplan an einem Ort.
                </p>

                {!loggedIn && (
                    <div className="home-actions">
                        <Link href="/login">
                            <button className="btn-primary">Anmelden</button>
                        </Link>

                        <Link href="/register">
                            <button className="btn-secondary">Registrieren</button>
                        </Link>
                    </div>
                )}

                {loggedIn && (
                    <div className="home-actions">
                        <Link href="/user">
                            <button className="btn-primary">Zu deinem Profil</button>
                        </Link>
                    </div>
                )}
            </div>
        </main>
    );
}
