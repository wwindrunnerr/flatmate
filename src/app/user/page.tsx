"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "./user.css";

type Membership = {
    id: string;
    role: "ADMIN" | "MEMBER";
    wg: {
        id: string;
        title: string;
    };
};

type MeUser = {
    id: string;
    name: string;
    email: string;
    birthDate: string | null;
    memberships: Membership[];
};

function formatBirthDate(value: string | null) {
    if (!value) return "Nicht angegeben";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Nicht angegeben";
    }

    return new Intl.DateTimeFormat("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date);
}

function toInputDate(value: string | null) {
    if (!value) return "";
    return new Date(value).toISOString().slice(0, 10);
}

export default function UserPage() {
    const router = useRouter();

    const [user, setUser] = useState<MeUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // State fürs Modal
    const [isBirthDateOpen, setIsBirthDateOpen] = useState(false);
    const [birthDateInput, setBirthDateInput] = useState("");
    const [savingBirthDate, setSavingBirthDate] = useState(false);
    const [birthDateMsg, setBirthDateMsg] = useState("");

    async function loadUser() {
        try {
            setLoading(true);
            setError("");

            const res = await fetch("/api/me", {
                credentials: "include",
                cache: "no-store",
            });

            if (res.status === 401) {
                window.location.href = "/login";
                return;
            }

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Benutzerdaten konnten nicht geladen werden.");
                setLoading(false);
                return;
            }

            setUser(data.user ?? null);
            // Input-Feld mit bestehendem Datum vorbefüllen
            if (data.user?.birthDate) {
                setBirthDateInput(toInputDate(data.user.birthDate));
            }
            setLoading(false);
        } catch (err) {
            console.error("USER_PAGE_LOAD_ERROR", err);
            setError("Benutzerdaten konnten nicht geladen werden.");
            setLoading(false);
        }
    }

    useEffect(() => {
        loadUser();
    }, []);

  async function handleSaveBirthDate() {
        setSavingBirthDate(true);
        setBirthDateMsg("");
        
        try {
            const res = await fetch("/api/me", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                // Das Datum an die API senden
                body: JSON.stringify({ birthDate: birthDateInput }),
            });

            // -- NEU: Sichereres Lesen der Server-Antwort --
            const text = await res.text();
            let data: any = {};
            
            if (text) {
                try {
                    data = JSON.parse(text);
                } catch (parseError) {
                    console.error("Die Serverantwort war kein JSON. Antwort war:", text);
                }
            }

            if (!res.ok) {
                setBirthDateMsg(data.error || `Fehler beim Speichern (Status: ${res.status})`);
                setSavingBirthDate(false);
                return;
            }

            // Erfolgreich gespeichert
            await loadUser(); 
            setIsBirthDateOpen(false); 
            setSavingBirthDate(false);
        } catch (err) {
            console.error("SAVE_BIRTHDATE_ERROR", err);
            setBirthDateMsg("Ein unerwarteter Verbindungsfehler ist aufgetreten.");
            setSavingBirthDate(false);
        }
    }

    async function handleLeaveWG(wgId: string) {
        const confirmed = window.confirm("Möchtest du diese WG wirklich verlassen?");
        if (!confirmed) return;

        try {
            const res = await fetch(`/api/wgs/${wgId}/leave`, {
                method: "POST",
                credentials: "include",
            });

            const text = await res.text();
            const data = text ? JSON.parse(text) : {};

            if (!res.ok) {
                alert(data.error || "WG konnte nicht verlassen werden.");
                return;
            }

            await loadUser();
        } catch (err) {
            console.error("LEAVE_WG_ERROR", err);
            alert("WG konnte nicht verlassen werden.");
        }
    }

    async function handleDeleteWG(wgId: string) {
        const confirmed = window.confirm("Möchtest du diese WG wirklich löschen?");
        if (!confirmed) return;

        try {
            const res = await fetch(`/api/wgs/${wgId}`, {
                method: "DELETE",
                credentials: "include",
            });

            const text = await res.text();
            const data = text ? JSON.parse(text) : {};

            if (!res.ok) {
                alert(data.error || "WG konnte nicht gelöscht werden.");
                return;
            }

            await loadUser();
        } catch (err) {
            console.error("DELETE_WG_ERROR", err);
            alert("WG konnte nicht gelöscht werden.");
        }
    }

    async function handleLogout() {
        try {
            const res = await fetch("/api/logout", {
                method: "POST",
                credentials: "include",
            });

            if (!res.ok) {
                alert("Abmelden fehlgeschlagen.");
                return;
            }

            window.location.href = "/login";
        } catch (err) {
            console.error("LOGOUT_ERROR", err);
            alert("Abmelden fehlgeschlagen.");
        }
    }

    if (loading) {
        return <div className="user-page">Lade Profil...</div>;
    }

    if (error) {
        return <div className="user-page">{error}</div>;
    }

    if (!user) {
        return <div className="user-page">Kein Benutzer gefunden.</div>;
    }

    return (
        <>
            <div className="user-page">
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
                            <button
                                type="button"
                                className="edit-birthdate-btn"
                                onClick={() => setIsBirthDateOpen(true)}
                                style={{ marginLeft: "10px" }}
                            >
                                {user.birthDate ? "Bearbeiten" : "Hinzufügen"}
                            </button>
                        </p>
                    </div>

                    <div className="section">
                        <h2 className="section-title">Deine WGs</h2>

                        {user.memberships.length === 0 ? (
                            <p className="muted-text">Du bist aktuell in keiner WG.</p>
                        ) : (
                            <ul className="wg-list">
                                {user.memberships.map((membership) => (
                                    <li key={membership.id} className="wg-item">
                                        <div className="wg-card">
                                            <Link
                                                href={`/wg/${membership.wg.id}`}
                                                className="btn-primary"
                                            >
                                                {membership.wg.title}
                                            </Link>

                                            <button
                                                className="wg-leave-btn"
                                                onClick={() => handleLeaveWG(membership.wg.id)}
                                            >
                                                WG verlassen
                                            </button>

                                            {membership.role === "ADMIN" && (
                                                <button
                                                    className="wg-delete-btn"
                                                    onClick={() => handleDeleteWG(membership.wg.id)}
                                                >
                                                    WG löschen
                                                </button>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <button
                            className="btn-secondary full-width"
                            onClick={() => router.push("/create_wg")}
                        >
                            Neue WG erstellen
                        </button>
                    </div>

                    <button className="logout-btn" onClick={handleLogout}>
                        Abmelden
                    </button>
                </div>
            </div>

            {/* NEU: Das Modal für das Geburtsdatum */}
            {isBirthDateOpen && (
                <div 
                    style={{
                        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: "rgba(0,0,0,0.5)", display: "flex",
                        alignItems: "center", justifyContent: "center", zIndex: 1000
                    }}
                >
                    <div 
                        style={{
                            background: "white", padding: "2rem", borderRadius: "8px", 
                            width: "90%", maxWidth: "400px", color: "black"
                        }}
                    >
                        <h3>Geburtsdatum {user.birthDate ? "bearbeiten" : "hinzufügen"}</h3>
                        
                        <input
                            type="date"
                            value={birthDateInput}
                            onChange={(e) => setBirthDateInput(e.target.value)}
                            style={{ 
                                width: "100%", padding: "0.5rem", marginTop: "1rem", 
                                marginBottom: "1rem", border: "1px solid #ccc", borderRadius: "4px" 
                            }}
                        />

                        {birthDateMsg && <p style={{ color: "red", fontSize: "0.9rem" }}>{birthDateMsg}</p>}

                        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                            <button
                                onClick={() => setIsBirthDateOpen(false)}
                                className="btn-secondary"
                                disabled={savingBirthDate}
                            >
                                Abbrechen
                            </button>
                            <button
                                onClick={handleSaveBirthDate}
                                className="btn-primary"
                                disabled={savingBirthDate}
                            >
                                {savingBirthDate ? "Speichert..." : "Speichern"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}