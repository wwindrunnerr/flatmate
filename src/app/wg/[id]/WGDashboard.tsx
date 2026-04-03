"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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

interface WGEvent {
    id: string;
    title: string;
    description: string | null;
    startsAt: string;
    createdAt: string;
    createdById: string;
    createdBy: {
        id: string;
        name: string;
        email: string;
    };
}

interface SessionUser {
    id: string;
    email: string;
    name: string;
}

export default function WGDashboard({ id }: { id: string }) {
    const [wg, setWG] = useState<WGData | null>(null);
    const [user, setUser] = useState<SessionUser | null>(null);
    const [events, setEvents] = useState<WGEvent[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const [inviteLink, setInviteLink] = useState("");
    const [inviteMsg, setInviteMsg] = useState("");

    const [eventForm, setEventForm] = useState({
        title: "",
        description: "",
        startsAt: "",
    });
    const [eventMsg, setEventMsg] = useState("");
    const [eventLoading, setEventLoading] = useState(false);
    const [isEventFormOpen, setIsEventFormOpen] = useState(false);

    useEffect(() => {
        async function loadDashboard() {
            try {
                const meRes = await fetch("/api/me", {
                    credentials: "include",
                    cache: "no-store",
                });

                if (meRes.ok) {
                    const meData = await meRes.json();
                    setUser(meData.user ?? null);
                }

                const wgRes = await fetch(`/api/wgs/${id}`, {
                    credentials: "include",
                    cache: "no-store",
                });

                if (wgRes.status === 401) {
                    window.location.href = "/login";
                    return;
                }

                if (wgRes.status === 403) {
                    setError("Du hast keinen Zugriff auf diese WG.");
                    setLoading(false);
                    return;
                }

                if (wgRes.status === 404) {
                    setError("WG nicht gefunden.");
                    setLoading(false);
                    return;
                }

                const wgData = await wgRes.json();
                setWG(wgData.wg);

                const eventsRes = await fetch(`/api/wgs/${id}/events`, {
                    credentials: "include",
                    cache: "no-store",
                });

                if (!eventsRes.ok) {
                    setError("Events konnten nicht geladen werden.");
                    setLoading(false);
                    return;
                }

                const eventsData = await eventsRes.json();
                setEvents(eventsData.events ?? []);
                setLoading(false);
            } catch (err) {
                console.error("WG_DASHBOARD_LOAD_ERROR", err);
                setError("Daten konnten nicht geladen werden.");
                setLoading(false);
            }
        }

        loadDashboard();
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

    function formatEventDate(value: string) {
        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "Ungültiges Datum";
        }

        return new Intl.DateTimeFormat("de-DE", {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(date);
    }

    function handleEventFieldChange(
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) {
        const { name, value } = e.target;

        setEventForm((prev) => ({
            ...prev,
            [name]: value,
        }));

        setEventMsg("");
    }

    async function handleCreateEvent() {
        setEventLoading(true);
        setEventMsg("");

        try {
            const res = await fetch(`/api/wgs/${id}/events`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(eventForm),
            });

            const data = await res.json();

            if (!res.ok) {
                setEventMsg(data.error || "Event konnte nicht erstellt werden");
                return;
            }

            setEvents((prev) =>
                [...prev, data.event].sort(
                    (a, b) =>
                        new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
                )
            );

            setEventForm({
                title: "",
                description: "",
                startsAt: "",
            });

            setIsEventFormOpen(false);
            setEventMsg("Event erfolgreich erstellt.");
        } catch (error) {
            console.error("CREATE_EVENT_ERROR", error);
            setEventMsg("Netzwerkfehler beim Erstellen des Events");
        } finally {
            setEventLoading(false);
        }
    }

    async function handleDeleteEvent(eventId: string) {
        const confirmed = window.confirm(
            "Möchtest du dieses Event wirklich löschen?"
        );

        if (!confirmed) return;

        try {
            const res = await fetch(`/api/wgs/${id}/events/${eventId}`, {
                method: "DELETE",
                credentials: "include",
            });

            const data = await res.json();

            if (!res.ok) {
                setEventMsg(data.error || "Event konnte nicht gelöscht werden");
                return;
            }

            setEvents((prev) => prev.filter((event) => event.id !== eventId));
        } catch (error) {
            console.error("DELETE_EVENT_ERROR", error);
            setEventMsg("Netzwerkfehler beim Löschen des Events");
        }
    }

    const sortedEvents = useMemo(() => {
        return [...events].sort(
            (a, b) =>
                new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
        );
    }, [events]);

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
                            <Link href={`/wg/${id}/einkaufsliste`}>Wocheneinkauf</Link>
                        </li>
                        <li className="wg-link-item">
                            <Link href={`/wg/${id}/einkaufsliste`}>Putzmittel</Link>
                        </li>
                        <li className="wg-link-item">
                            <Link href={`/wg/${id}/einkaufsliste`}>Vorräte</Link>
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

                        <button
                            className="wg-card-action"
                            onClick={() => {
                                setIsEventFormOpen((prev) => !prev);
                                setEventMsg("");
                            }}
                        >
                            {isEventFormOpen ? "Schließen" : "Event hinzufügen"}
                        </button>
                    </div>

                    {sortedEvents.length === 0 ? (
                        <p className="wg-note">Noch keine Events vorhanden.</p>
                    ) : (
                        <div className="wg-events-list">
                            {sortedEvents.slice(0, 5).map((event) => {
                                const canDelete =
                                    wg.currentUserRole === "ADMIN" || user?.id === event.createdById;

                                return (
                                    <div key={event.id} className="wg-event-item">
                                        <div className="wg-event-main">
                                            <p className="wg-event-title">{event.title}</p>
                                            <p className="wg-event-date">
                                                {formatEventDate(event.startsAt)}
                                            </p>
                                            {event.description && (
                                                <p className="wg-event-description">{event.description}</p>
                                            )}
                                            <p className="wg-event-meta">
                                                Erstellt von {event.createdBy.name}
                                            </p>
                                        </div>

                                        {canDelete && (
                                            <button
                                                className="wg-btn-danger"
                                                onClick={() => handleDeleteEvent(event.id)}
                                            >
                                                Löschen
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {isEventFormOpen && (
                        <div className="wg-event-form">
                            <input
                                className="wg-input"
                                name="title"
                                placeholder="Event-Titel"
                                value={eventForm.title}
                                onChange={handleEventFieldChange}
                                disabled={eventLoading}
                            />

                            <input
                                className="wg-input"
                                name="startsAt"
                                type="datetime-local"
                                value={eventForm.startsAt}
                                onChange={handleEventFieldChange}
                                disabled={eventLoading}
                            />

                            <textarea
                                className="wg-textarea"
                                name="description"
                                placeholder="Beschreibung (optional)"
                                value={eventForm.description}
                                onChange={handleEventFieldChange}
                                disabled={eventLoading}
                            />

                            <div className="wg-actions-row">
                                <button
                                    className="wg-btn-secondary"
                                    onClick={() => {
                                        setIsEventFormOpen(false);
                                        setEventMsg("");
                                    }}
                                    disabled={eventLoading}
                                >
                                    Abbrechen
                                </button>

                                <button
                                    className="wg-btn-primary"
                                    onClick={handleCreateEvent}
                                    disabled={eventLoading}
                                >
                                    {eventLoading ? "Wird erstellt..." : "Event erstellen"}
                                </button>
                            </div>
                        </div>
                    )}

                    {eventMsg && (
                        <p className={eventMsg.includes("erfolgreich") ? "wg-success" : "wg-error"}>
                            {eventMsg}
                        </p>
                    )}
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
                                <p
                                    className={
                                        inviteMsg.includes("erfolgreich") ||
                                        inviteMsg.includes("kopiert")
                                            ? "wg-success"
                                            : "wg-error"
                                    }
                                >
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