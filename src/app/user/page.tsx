"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import "./user.css";

interface User {
    id: string;
    email: string;
    name: string;
    birthDate: string | null;
    avatarUrl: string | null;
    createdAt: string;
}

interface WG {
    id: string;
    title: string;
    description: string | null;
    role: "ADMIN" | "MEMBER";
    joinedAt: string;
    createdAt: string;
    updatedAt: string;
}

export default function DashboardPage() {
    const [user, setUser] = useState<User | null>(null);
    const [wgs, setWgs] = useState<WG[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        async function loadDashboard() {
            try {
                setLoading(true);
                setErrorMessage("");

                const meRes = await fetch("/api/me", {
                    credentials: "include",
                    cache: "no-store",
                });

                if (meRes.status === 401) {
                    window.location.href = "/login";
                    return;
                }

                const meData = await meRes.json();

                if (!meRes.ok || !meData.user) {
                    window.location.href = "/login";
                    return;
                }

                setUser(meData.user);

                const wgsRes = await fetch("/api/wgs", {
                    credentials: "include",
                    cache: "no-store",
                });

                if (wgsRes.status === 401) {
                    window.location.href = "/login";
                    return;
                }

                const wgsData = await wgsRes.json();

                if (!wgsRes.ok) {
                    setErrorMessage(wgsData.error || "WGs konnten nicht geladen werden");
                    setWgs([]);
                    return;
                }

                setWgs(wgsData.wgs ?? []);
            } catch (error) {
                console.error("USER_PAGE_ERROR", error);
                setErrorMessage("Daten konnten nicht geladen werden");
            } finally {
                setLoading(false);
            }
        }

        loadDashboard();
    }, []);

    async function handleLeaveWG(wgId: string) {
        const confirmed = window.confirm(
            "Möchtest du diese WG wirklich verlassen?"
        );

        if (!confirmed) return;

        try {
            const res = await fetch(`/api/wgs/${wgId}/leave`, {
                method: "POST",
                credentials: "include",
            });

            const data = await res.json();

            if (!res.ok) {
                setErrorMessage(data.error || "WG konnte nicht verlassen werden");
                return;
            }

            setWgs((prev) => prev.filter((wg) => wg.id !== wgId));
        } catch (error) {
            console.error("LEAVE_WG_PAGE_ERROR", error);
            setErrorMessage("Netzwerkfehler beim Verlassen der WG");
        }
    }

    async function handleDeleteWG(wgId: string) {
        const confirmed = window.confirm(
            "Möchtest du diese WG wirklich endgültig löschen? Diese Aktion betrifft alle Mitglieder."
        );

        if (!confirmed) return;

        try {
            const res = await fetch(`/api/wgs/${wgId}`, {
                method: "DELETE",
                credentials: "include",
            });

            const data = await res.json();

            if (!res.ok) {
                setErrorMessage(data.error || "WG konnte nicht gelöscht werden");
                return;
            }

            setWgs((prev) => prev.filter((wg) => wg.id !== wgId));
        } catch (error) {
            console.error("DELETE_WG_PAGE_ERROR", error);
            setErrorMessage("Netzwerkfehler beim Löschen der WG");
        }
    }

    async function handleLogout() {
        try {
            await fetch("/api/logout", {
                method: "POST",
                credentials: "include",
            });
        } catch (error) {
            console.error("LOGOUT_PAGE_ERROR", error);
        } finally {
            window.location.href = "/";
        }
    }

    function formatBirthDate(value: string | null) {
        if (!value) return "Nicht angegeben";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "Ungültiges Datum";
        }

        return new Intl.DateTimeFormat("de-DE").format(date);
    }

    if (loading) {
        return <p>Lade...</p>;
    }

    if (!user) {
        return <p>Weiterleitung...</p>;
    }

    return (
        <main className="user-page">
            <div className="user-card">
                <h1 className="user-title">Willkommen, {user.name}!</h1>
                <p className="user-subtitle">
                    Hier findest du eine Übersicht über dein Profil und deine WGs.
                </p>

                <div className="user-info">
                    <p>
                        <span className="info-label">E-Mail:</span> {user.email}
                    </p>
                    <p>
                        <span className="info-label">Geburtsdatum:</span>{" "}
                        {formatBirthDate(user.birthDate)}
                    </p>
                </div>

                <div className="section">
                    <h2 className="section-title">Deine WGs</h2>

                    {errorMessage && <p className="muted-text">{errorMessage}</p>}

                    {!errorMessage && wgs.length === 0 && (
                        <p className="muted-text">Du bist noch in keiner WG.</p>
                    )}

                    {wgs.length > 0 && (
                        <ul className="wg-list">
                            {wgs.map((wg) => (
                                <li key={wg.id} className="wg-item">
                                    <div className="wg-card">
                                        <Link href={`/wg/${wg.id}`}>
                                            <button className="btn-primary">{wg.title}</button>
                                        </Link>

                                        <button
                                            className="wg-leave-btn"
                                            onClick={() => handleLeaveWG(wg.id)}
                                        >
                                            WG verlassen
                                        </button>

                                        {wg.role === "ADMIN" && (
                                            <button
                                                className="wg-delete-btn"
                                                onClick={() => handleDeleteWG(wg.id)}
                                            >
                                                WG löschen
                                            </button>
                                        )}
                                    </div>
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

                <button className="logout-btn" onClick={handleLogout}>
                    Abmelden
                </button>
            </div>
        </main>
    );
}