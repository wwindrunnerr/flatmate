"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

interface WGMember {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    role: "ADMIN" | "MEMBER";
    joinedAt: string;
}

interface WGData {
    id: string;
    title: string;
    description: string | null;
    currentUserRole: "ADMIN" | "MEMBER";
    members: WGMember[];
}

export default function WGDashboard({ id }: { id: string }) {
    const [wg, setWG] = useState<WGData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [inviteLink, setInviteLink] = useState("");
    const [inviteMsg, setInviteMsg] = useState("");

    useEffect(() => {
        async function loadWg() {
            const res = await fetch(`/api/wgs/${id}`, {
                credentials: "include",
                cache: "no-store",
            });

            if (res.status === 401) {
                window.location.href = "/login";
                return;
            }

            if (res.status === 403) {
                setError("Du hast keinen Zugriff auf diese WG.");
                setLoading(false);
                return;
            }

            if (res.status === 404) {
                setError("WG nicht gefunden.");
                setLoading(false);
                return;
            }

            const data = await res.json();
            setWG(data.wg);
            setLoading(false);
        }

        loadWg();
    }, [id]);

    async function handleCreateInvite() {
        try {
            setInviteMsg("");
            setInviteLink("");

            const res = await fetch(`/api/wgs/${id}/invites`, {
                method: "POST",
                credentials: "include",
            });

            const data = await res.json();

            if (!res.ok) {
                setInviteMsg(data.error || "Einladung konnte nicht erstellt werden");
                return;
            }

            const fullLink = `${window.location.origin}/invite/${data.invite.code}`;
            setInviteLink(fullLink);
            setInviteMsg("Einladungslink erfolgreich erstellt.");
        } catch (error) {
            console.error("CREATE_INVITE_FRONTEND_ERROR", error);
            setInviteMsg("Netzwerkfehler beim Erstellen der Einladung");
        }
    }

    async function handleCopyInvite() {
        if (!inviteLink) return;

        try {
            await navigator.clipboard.writeText(inviteLink);
            setInviteMsg("Einladungslink kopiert.");
        } catch (error) {
            console.error("COPY_INVITE_ERROR", error);
            setInviteMsg("Link konnte nicht kopiert werden.");
        }
    }

    if (loading) return <div className="wg-loading">Lade WG...</div>;
    if (error) return <div className="wg-loading wg-error">{error}</div>;
    if (!wg) return <div className="wg-empty-state">Keine WG-Daten verfügbar.</div>;

    return (
        <>
            <section className="wg-dashboard-grid">
                <div className="wg-card">
                    <div className="wg-card-title-row">
                        <h2 className="wg-card-title">Budget</h2>
                    </div>

                    <div className="wg-row">
                        <span className="wg-row-label">Zum Denis</span>
                        <span className="wg-row-value">78 €</span>
                    </div>
                    <div className="wg-row">
                        <span className="wg-row-label">Zum Yaroslav</span>
                        <span className="wg-row-value">67 €</span>
                    </div>
                    <div className="wg-row">
                        <span className="wg-row-label">Von Mykyta</span>
                        <span className="wg-row-value">2000 €</span>
                    </div>
                </div>

                <div className="wg-card">
                    <div className="wg-card-title-row">
                        <h2 className="wg-card-title">Einkaufsliste</h2>
                    </div>

                    <ul className="wg-link-list">
                        <li className="wg-link-item">
                            <Link href={`${id}/einkaufsliste`}>Wocheneinkauf</Link>
                        </li>
                        <li className="wg-link-item">
                            <Link href={`${id}/einkaufsliste`}>Putzmittel</Link>
                        </li>
                        <li className="wg-link-item">
                            <Link href={`${id}/einkaufsliste`}>Vorräte</Link>
                        </li>
                    </ul>
                </div>

                <div className="wg-card">
                    <div className="wg-card-title-row">
                        <h2 className="wg-card-title">Noch zum Putzen</h2>
                    </div>

                    <div className="wg-row">
                        <span className="wg-row-label">Bad</span>
                        <input className="wg-checkbox" type="checkbox" />
                    </div>
                    <div className="wg-row">
                        <span className="wg-row-label">Küche</span>
                        <input className="wg-checkbox" type="checkbox" defaultChecked />
                    </div>
                </div>

                <div className="wg-card">
                    <div className="wg-card-title-row">
                        <h2 className="wg-card-title">Events</h2>
                    </div>

                    <div className="wg-row">
                        <span className="wg-row-label">Waschtag</span>
                        <span className="wg-row-value">morgen</span>
                    </div>
                    <div className="wg-row">
                        <span className="wg-row-label">Hausmeister</span>
                        <span className="wg-row-value">in 3 Tagen</span>
                    </div>
                    <div className="wg-row">
                        <span className="wg-row-label">Geburtstag</span>
                        <span className="wg-row-value">10.11.2025</span>
                    </div>
                </div>
            </section>

            <section className="wg-stack">
                <div className="wg-card">
                    <div className="wg-card-title-row">
                        <div>
                            <h2 className="wg-card-title">Mitglieder</h2>
                            <p className="wg-card-subtitle">
                                Alle Personen, die aktuell Teil dieser WG sind.
                            </p>
                        </div>
                    </div>

                    <ul className="wg-members-list">
                        {wg.members.map((member) => (
                            <li key={member.id} className="wg-member-item">
                                <div className="wg-member-main">
                                    <p className="wg-member-name">{member.name}</p>
                                    <p className="wg-member-email">{member.email}</p>
                                </div>

                                <div className="wg-member-meta">
                  <span
                      className={`wg-badge ${
                          member.role === "ADMIN"
                              ? "wg-badge-admin"
                              : "wg-badge-member"
                      }`}
                  >
                    {member.role}
                  </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {wg.currentUserRole === "ADMIN" && (
                    <div className="wg-card">
                        <div className="wg-card-title-row">
                            <div>
                                <h2 className="wg-card-title">Einladung</h2>
                                <p className="wg-card-subtitle">
                                    Erstelle einen Link, über den neue Mitglieder beitreten können.
                                </p>
                            </div>
                        </div>

                        <div className="wg-invite-box">
                            <div className="wg-actions-row">
                                <button className="wg-btn-primary" onClick={handleCreateInvite}>
                                    Einladungslink erstellen
                                </button>

                                {inviteLink && (
                                    <button className="wg-btn-secondary" onClick={handleCopyInvite}>
                                        Link kopieren
                                    </button>
                                )}
                            </div>

                            {inviteLink && (
                                <div className="wg-invite-link">{inviteLink}</div>
                            )}

                            {!inviteLink && (
                                <p className="wg-note">
                                    Der Link ist standardmäßig 7 Tage gültig.
                                </p>
                            )}

                            {inviteMsg && (
                                <p className={inviteMsg.includes("erfolgreich") || inviteMsg.includes("kopiert") ? "wg-success" : "wg-error"}>
                                    {inviteMsg}
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </section>
        </>
    );
}