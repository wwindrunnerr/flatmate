"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import "./user.css";

interface WG {
    id: string;
    title: string;
    description: string;
    members: string[];
    admin: string;
}

export default function DashboardPage() {
    const [user, setUser] = useState<any>(null);
    const [wgs, setWgs] = useState<WG[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadUser() {
            // Load user using cookie (must include credentials)
            const res = await fetch("/api/me", {
                credentials: "include",
            });

            if (res.status === 401) {
                window.location.href = "/login";
                return;
            }

            const data = await res.json();
            if (!data.user) {
                window.location.href = "/login";
                return;
            }

            setUser(data.user);

            // Now load WGs
            const wgsRes = await fetch("/api/wgs", {
                credentials: "include",
                cache: "no-store",
            });

            const wgsData = await wgsRes.json();

            // Filter WGs where this user is a member
            const myWgs = wgsData.wgs.filter((wg: WG) =>
                wg.members.includes(data.user.email)
            );

            setWgs(myWgs);
            setLoading(false);
        }

        loadUser();
    }, []);

    if (loading || !user) return <p>Lade...</p>;

    const handleLogout = () => {
        document.cookie = "user=; Max-Age=0; path=/;";
        window.location.href = "/";
    };

    return (
        <main className="user-page">
            <div className="user-card">
                {/* HEADER */}
                <h1 className="user-title">Willkommen, {user.name}!</h1>
                <p className="user-subtitle">
                    Hier findest du eine Übersicht über dein Profil und deine WGs.
                </p>

                {/* USER INFOS */}
                <div className="user-info">
                    <p><span className="info-label">E-Mail:</span> {user.email}</p>
                    <p><span className="info-label">Geburtsdatum:</span> {user.age}</p>
                    <p><span className="info-label">Geschlecht:</span> {user.gender}</p>
                </div>

                {/* WGs */}
                <div className="section">
                    <h2 className="section-title">Deine WGs</h2>

                    {wgs.length === 0 && (
                        <p className="muted-text">Du bist noch in keiner WG.</p>
                    )}

                    {wgs.length > 0 && (
                        <ul className="wg-list">
                            {wgs.map((wg) => (
                                <li key={wg.id} className="wg-item">
                                    <Link href={`/wg/${wg.id}`}>
                                        <button className="btn-primary">
                                            {wg.title}
                                        </button>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}

                    <Link href="/create_wg">
                        <button className="btn-secondary full-width">
                            Neue WG erstellen
                        </button>
                    </Link>
                </div>

                {/* LOGOUT */}
                <button className="logout-btn" onClick={handleLogout}>
                    Abmelden
                </button>
            </div>
        </main>
    );
}
