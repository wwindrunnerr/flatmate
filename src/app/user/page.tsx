"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import PencilIcon from "@/components/icons/PencilIcon";

type UserData = {
    id: string;
    name: string;
    email: string;
    birthDate: string | null;
};

type WGItem = {
    id: string;
    title: string;
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

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    return date.toISOString().split("T")[0];
}

export default function UserPage() {
    const [user, setUser] = useState<UserData | null>(null);
    const [wgs, setWgs] = useState<WGItem[]>([]);
    const [loading, setLoading] = useState(true);

    const [isBirthDateOpen, setIsBirthDateOpen] = useState(false);
    const [birthDateInput, setBirthDateInput] = useState("");
    const [savingBirthDate, setSavingBirthDate] = useState(false);
    const [birthDateMsg, setBirthDateMsg] = useState("");

    useEffect(() => {
        async function loadUserData() {
            try {
                const [meRes, wgsRes] = await Promise.all([
                    fetch("/api/me", {
                        credentials: "include",
                        cache: "no-store",
                    }),
                    fetch("/api/wgs", {
                        credentials: "include",
                        cache: "no-store",
                    }),
                ]);

                if (meRes.status === 401 || wgsRes.status === 401) {
                    window.location.href = "/login";
                    return;
                }

                const meData = await meRes.json();
                const wgsData = await wgsRes.json();

                setUser(meData.user ?? null);
                setWgs(wgsData.wgs ?? []);
                setBirthDateInput(toInputDate(meData.user?.birthDate ?? null));
                setLoading(false);
            } catch (error) {
                console.error("USER_PAGE_LOAD_ERROR", error);
                setLoading(false);
            }
        }

        loadUserData();
    }, []);

    async function handleSaveBirthDate() {
        try {
            setSavingBirthDate(true);
            setBirthDateMsg("");

            const res = await fetch("/api/me", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    birthDate: birthDateInput ? birthDateInput : null,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setBirthDateMsg(data.error || "Geburtsdatum konnte nicht gespeichert werden.");
                setSavingBirthDate(false);
                return;
            }

            setUser(data.user ?? null);
            setBirthDateInput(toInputDate(data.user?.birthDate ?? null));
            setBirthDateMsg("Geburtsdatum erfolgreich gespeichert.");
            setIsBirthDateOpen(false);
        } catch (error) {
            console.error("SAVE_BIRTHDATE_ERROR", error);
            setBirthDateMsg("Geburtsdatum konnte nicht gespeichert werden.");
        } finally {
            setSavingBirthDate(false);
        }
    }

    async function handleDeleteBirthDate() {
        try {
            setSavingBirthDate(true);
            setBirthDateMsg("");

            const res = await fetch("/api/me", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    birthDate: null,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setBirthDateMsg(data.error || "Geburtsdatum konnte nicht gelöscht werden.");
                setSavingBirthDate(false);
                return;
            }

            setUser(data.user ?? null);
            setBirthDateInput("");
            setBirthDateMsg("Geburtsdatum wurde gelöscht.");
            setIsBirthDateOpen(false);
        } catch (error) {
            console.error("DELETE_BIRTHDATE_ERROR", error);
            setBirthDateMsg("Geburtsdatum konnte nicht gelöscht werden.");
        } finally {
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

            if (!res.ok) {
                alert("WG konnte nicht verlassen werden.");
                return;
            }

            setWgs((prev) => prev.filter((wg) => wg.id !== wgId));
        } catch (error) {
            console.error("LEAVE_WG_ERROR", error);
            alert("WG konnte nicht verlassen werden.");
        }
    }

    if (loading) {
        return <div className="wg-loading">Lade Benutzerprofil...</div>;
    }

    if (!user) {
        return <div className="wg-loading wg-error">Benutzerdaten konnten nicht geladen werden.</div>;
    }

    return (
        <div className="wg-stack">
            <div className="wg-card">
                <h1 className="wg-title" style={{ marginBottom: "12px" }}>
                    Willkommen, {user.name}!
                </h1>

                <p className="wg-subtitle" style={{ marginBottom: "32px" }}>
                    Hier findest du eine Übersicht über dein Profil und deine WGs.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <strong>E-Mail:</strong>
                        <span>{user.email}</span>
                    </div>

                    <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                        <strong>Geburtsdatum:</strong>
                        <span>{formatBirthDate(user.birthDate)}</span>

                        <button
                            className="wg-btn-secondary"
                            onClick={() => {
                                setBirthDateInput(toInputDate(user.birthDate));
                                setBirthDateMsg("");
                                setIsBirthDateOpen(true);
                            }}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "8px 10px",
                                minWidth: "44px",
                            }}
                            aria-label="Geburtsdatum bearbeiten"
                            title="Geburtsdatum bearbeiten"
                        >
                            <PencilIcon />
                        </button>
                    </div>
                </div>

                {birthDateMsg && (
                    <p className={birthDateMsg.includes("erfolgreich") || birthDateMsg.includes("gelöscht") ? "wg-success" : "wg-error"}>
                        {birthDateMsg}
                    </p>
                )}
            </div>

            <div className="wg-card">
                <h2 className="wg-card-title" style={{ marginBottom: "20px" }}>
                    Deine WGs
                </h2>

                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "20px",
                        marginBottom: "24px",
                    }}
                >
                    {wgs.map((wg) => (
                        <div
                            key={wg.id}
                            style={{
                                width: "250px",
                                minHeight: "260px",
                                borderRadius: "28px",
                                border: "1px solid #eeddf4",
                                padding: "24px",
                                background: "#fff",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "flex-start",
                                gap: "14px",
                            }}
                        >
                            <Link
                                href={`/wg/${wg.id}`}
                                style={{
                                    width: "100%",
                                    background: "linear-gradient(180deg, #c92be3 0%, #b11fda 100%)",
                                    color: "#fff",
                                    textDecoration: "none",
                                    borderRadius: "16px",
                                    padding: "22px 16px",
                                    textAlign: "center",
                                    fontWeight: 700,
                                    fontSize: "18px",
                                }}
                            >
                                {wg.title}
                            </Link>

                            <button
                                className="wg-btn-secondary"
                                onClick={() => handleLeaveWG(wg.id)}
                                style={{ width: "100%" }}
                            >
                                WG verlassen
                            </button>
                        </div>
                    ))}
                </div>

                <Link
                    href="/create_wg"
                    className="wg-btn-secondary"
                    style={{
                        width: "100%",
                        display: "inline-flex",
                        justifyContent: "center",
                        textDecoration: "none",
                    }}
                >
                    Neue WG erstellen
                </Link>
            </div>

            {isBirthDateOpen && (
                <div className="popup-overlay" onClick={() => setIsBirthDateOpen(false)}>
                    <div
                        className="popup-modal"
                        onClick={(e) => e.stopPropagation()}
                        style={{ maxWidth: "520px", width: "100%" }}
                    >
                        <div className="wg-card-title-row" style={{ marginBottom: "16px" }}>
                            <div>
                                <h3 className="wg-card-title">Geburtsdatum bearbeiten</h3>
                                <p className="wg-card-subtitle">
                                    Hier kannst du dein Geburtsdatum angeben, ändern oder löschen.
                                </p>
                            </div>
                        </div>

                        <div className="wg-event-form">
                            <input
                                className="wg-input"
                                type="date"
                                value={birthDateInput}
                                onChange={(e) => setBirthDateInput(e.target.value)}
                                disabled={savingBirthDate}
                            />

                            <div className="wg-actions-row">
                                <button
                                    className="wg-btn-danger"
                                    onClick={handleDeleteBirthDate}
                                    disabled={savingBirthDate}
                                >
                                    Löschen
                                </button>

                                <button
                                    className="wg-btn-secondary"
                                    onClick={() => setIsBirthDateOpen(false)}
                                    disabled={savingBirthDate}
                                >
                                    Abbrechen
                                </button>

                                <button
                                    className="wg-btn-primary"
                                    onClick={handleSaveBirthDate}
                                    disabled={savingBirthDate}
                                >
                                    {savingBirthDate ? "Wird gespeichert..." : "Speichern"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}