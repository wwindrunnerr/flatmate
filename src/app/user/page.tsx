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

    // --- STATES FÜRS MODAL ---
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [nameInput, setNameInput] = useState("");
    const [birthDateInput, setBirthDateInput] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // --- STATES FÜR DEN E-MAIL BUTTON ---
    const [isSendingLink, setIsSendingLink] = useState(false);
    const [linkSent, setLinkSent] = useState(false);

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
            
            // Input-Felder mit bestehenden Daten vorbefüllen
            if (data.user) {
                setNameInput(data.user.name || "");
                if (data.user.birthDate) {
                    setBirthDateInput(toInputDate(data.user.birthDate));
                } else {
                    setBirthDateInput("");
                }
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

    // --- FUNKTION: PROFIL SPEICHERN ---
    async function handleSaveProfile() {
        setIsSaving(true);
        setErrorMsg("");
        
        try {
            const res = await fetch("/api/me", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ 
                    name: nameInput,
                    birthDate: birthDateInput 
                }),
            });

            // Sichereres Lesen der Server-Antwort
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
                setErrorMsg(data.error || `Fehler beim Speichern (Status: ${res.status})`);
                setIsSaving(false);
                return;
            }

            // Erfolgreich gespeichert
            await loadUser(); 
            setIsEditModalOpen(false); 
            setIsSaving(false);
        } catch (err) {
            console.error("SAVE_PROFILE_ERROR", err);
            setErrorMsg("Ein unerwarteter Verbindungsfehler ist aufgetreten.");
            setIsSaving(false);
        }
    }

    // --- FUNKTION: E-MAIL LINK SENDEN ---
    async function handleSendResetLink() {
        setIsSendingLink(true);
        setErrorMsg("");
        
        try {
            const res = await fetch("/api/me/reset-link", { method: "POST" });
            const data = await res.json();

            if (!res.ok) {
                setErrorMsg(data.error || "Fehler beim Senden der E-Mail");
            } else {
                setLinkSent(true);
                // Setzt den Button nach 5 Sekunden wieder auf den Ursprungszustand zurück
                setTimeout(() => setLinkSent(false), 5000);
            }
        } catch (err) {
            setErrorMsg("Verbindungsfehler beim Anfordern des Links.");
        } finally {
            setIsSendingLink(false);
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

    if (loading) return <div className="user-page">Lade Profil...</div>;
    if (error) return <div className="user-page">{error}</div>;
    if (!user) return <div className="user-page">Kein Benutzer gefunden.</div>;

    const inputStyle = { 
        width: "100%", padding: "0.6rem", marginTop: "0.3rem", 
        marginBottom: "1rem", border: "1px solid #ccc", borderRadius: "6px" 
    };

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
                        </p>
                        
                        <button
                            type="button"
                            className="btn-primary"
                            onClick={() => setIsEditModalOpen(true)}
                            style={{ marginTop: "15px" }}
                        >
                            Daten bearbeiten
                        </button>
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

            {/* Modal für Profilbearbeitung */}
            {isEditModalOpen && (
                <div 
                    style={{
                        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: "rgba(0,0,0,0.5)", display: "flex",
                        alignItems: "center", justifyContent: "center", zIndex: 1000
                    }}
                >
                    <div 
                        style={{
                            background: "white", padding: "2rem", borderRadius: "12px", 
                            width: "90%", maxWidth: "450px", color: "black",
                            boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
                        }}
                    >
                        <h3 style={{ marginBottom: "1.5rem" }}>Profil bearbeiten</h3>
                        
                        <label style={{ display: "block", fontWeight: "bold" }}>Name</label>
                        <input
                            type="text"
                            value={nameInput}
                            onChange={(e) => setNameInput(e.target.value)}
                            style={inputStyle}
                        />

                        <label style={{ display: "block", fontWeight: "bold" }}>Geburtsdatum</label>
                        <input
                            type="date"
                            value={birthDateInput}
                            onChange={(e) => setBirthDateInput(e.target.value)}
                            style={inputStyle}
                        />

                        <label style={{ display: "block", fontWeight: "bold", marginBottom: "0.3rem" }}>Passwort</label>
                        <button 
                            type="button" 
                            onClick={handleSendResetLink}
                            disabled={isSendingLink || linkSent}
                            style={{
                                width: "100%", 
                                padding: "0.6rem", 
                                marginBottom: "1rem", 
                                border: linkSent ? "1px solid #28a745" : "1px solid #ccc", 
                                borderRadius: "6px",
                                backgroundColor: linkSent ? "#d4edda" : "#f8f9fa",
                                color: linkSent ? "#155724" : "#333",
                                fontWeight: "bold",
                                cursor: (isSendingLink || linkSent) ? "not-allowed" : "pointer",
                                textAlign: "center"
                            }}
                        >
                            {isSendingLink 
                                ? "Wird gesendet..." 
                                : linkSent 
                                    ? "E-Mail mit Link versendet ✓" 
                                    : "Passwort-Reset Link per E-Mail senden"}
                        </button>

                        {errorMsg && <p style={{ color: "red", fontSize: "0.9rem" }}>{errorMsg}</p>}

                        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "1rem" }}>
                            <button
                                onClick={() => {
                                    setIsEditModalOpen(false);
                                    setErrorMsg("");
                                    setLinkSent(false); // Resetten, falls Modal später wieder geöffnet wird
                                }}
                                className="btn-secondary"
                                disabled={isSaving}
                            >
                                Abbrechen
                            </button>
                            <button
                                onClick={handleSaveProfile}
                                className="btn-primary"
                                disabled={isSaving}
                            >
                                {isSaving ? "Speichert..." : "Speichern"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}