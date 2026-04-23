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
    birthDate: string | null;
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
    isBirthday?: boolean;
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

interface BudgetSummaryItem {
    otherUserId: string;
    otherUserName: string;
    direction: "you_owe" | "owes_you" | "settled";
    amountCents: number;
    amount: number;
}

interface ExpensesResponse {
    expenses: Array<{
        id: string;
        description: string;
        amountCents: number;
        amount: number;
        createdAt: string;
        paidBy: {
            id: string;
            name: string;
            email: string;
        };
        participantUserIds: string[];
        participantNames: string[];
    }>;
    pairwiseBalances: Array<{
        fromUserId: string;
        fromUserName: string;
        toUserId: string;
        toUserName: string;
        amountCents: number;
        amount: number;
    }>;
    currentUserSummary: BudgetSummaryItem[];
}

function formatEuro(amount: number) {
    return new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR",
    }).format(amount);
}

function getNextBirthdayDate(birthDate: string) {
    const original = new Date(birthDate);
    if (Number.isNaN(original.getTime())) return null;

    const now = new Date();
    const currentYear = now.getFullYear();

    const nextBirthday = new Date(
        currentYear,
        original.getMonth(),
        original.getDate(),
        12,
        0,
        0,
        0
    );

    if (nextBirthday < now) {
        nextBirthday.setFullYear(currentYear + 1);
    }

    return nextBirthday;
}

export default function WGDashboard({ id }: { id: string }) {
    const [wg, setWG] = useState<WGData | null>(null);
    const [user, setUser] = useState<SessionUser | null>(null);
    const [events, setEvents] = useState<WGEvent[]>([]);
    const [budgetSummary, setBudgetSummary] = useState<BudgetSummaryItem[]>([]);
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
    const [isAllEventsOpen, setIsAllEventsOpen] = useState(false);

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

                const [eventsRes, budgetRes] = await Promise.all([
                    fetch(`/api/wgs/${id}/events`, {
                        credentials: "include",
                        cache: "no-store",
                    }),
                    fetch(`/api/wgs/${id}/expenses`, {
                        credentials: "include",
                        cache: "no-store",
                    }),
                ]);

                if (!eventsRes.ok) {
                    setError("Events konnten nicht geladen werden.");
                    setLoading(false);
                    return;
                }

                const eventsData = await eventsRes.json();
                setEvents(eventsData.events ?? []);

                if (budgetRes.ok) {
                    const budgetData: ExpensesResponse = await budgetRes.json();
                    setBudgetSummary(budgetData.currentUserSummary ?? []);
                } else {
                    setBudgetSummary([]);
                }

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

    const birthdayEvents = useMemo(() => {
        if (!wg) return [];

        return wg.members
            .filter((member) => member.birthDate)
            .map((member) => {
                const nextBirthday = getNextBirthdayDate(member.birthDate as string);
                if (!nextBirthday) return null;

                return {
                    id: `birthday-${member.id}`,
                    title: `🎂 Geburtstag: ${member.name}`,
                    description: `${member.name} hat Geburtstag`,
                    startsAt: nextBirthday.toISOString(),
                    createdAt: nextBirthday.toISOString(),
                    createdById: member.id,
                    createdBy: {
                        id: member.id,
                        name: member.name,
                        email: member.email,
                    },
                    isBirthday: true,
                } as WGEvent;
            })
            .filter(Boolean) as WGEvent[];
    }, [wg]);

    const sortedEvents = useMemo(() => {
        return [...events, ...birthdayEvents].sort(
            (a, b) =>
                new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
        );
    }, [events, birthdayEvents]);

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

                    {budgetSummary.length === 0 ? (
                        <p className="wg-note">Aktuell gibt es keine offenen Schulden.</p>
                    ) : (
                        <div className="wg-dashboard-budget-list">
                            {budgetSummary.slice(0, 4).map((item) => (
                                <div key={item.otherUserId} className="wg-dashboard-budget-item">
                                    {item.direction === "you_owe" && (
                                        <p className="wg-row-label">
                                            Du schuldest {item.otherUserName} {formatEuro(item.amount)}
                                        </p>
                                    )}

                                    {item.direction === "owes_you" && (
                                        <p className="wg-row-label">
                                            Du bekommst von {item.otherUserName} {formatEuro(item.amount)}
                                        </p>
                                    )}

                                    {item.direction === "settled" && (
                                        <p className="wg-row-label">
                                            Du bist quitt mit {item.otherUserName}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
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
                        <>
                            <div className="wg-events-list">
                                {sortedEvents.slice(0, 5).map((event) => {
                                    const canDelete =
                                        !event.isBirthday &&
                                        (wg.currentUserRole === "ADMIN" || user?.id === event.createdById);

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
                                                    {event.isBirthday
                                                        ? "Automatisch aus Geburtsdatum erzeugt"
                                                        : `Erstellt von ${event.createdBy.name}`}
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

                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "center",
                                    marginTop: "16px",
                                }}
                            >
                                <button
                                    className="wg-btn-secondary"
                                    onClick={() => setIsAllEventsOpen(true)}
                                >
                                    Alle Events anzeigen
                                </button>
                            </div>
                        </>
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

            {isAllEventsOpen && (
                <div className="popup-overlay" onClick={() => setIsAllEventsOpen(false)}>
                    <div
                        className="popup-modal"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            maxWidth: "720px",
                            width: "100%",
                            maxHeight: "80vh",
                            overflowY: "auto",
                        }}
                    >
                        <div className="wg-card-title-row" style={{ marginBottom: "16px" }}>
                            <div>
                                <h3 className="wg-card-title">Alle Events</h3>
                                <p className="wg-card-subtitle">
                                    Übersicht über alle anstehenden Events und Geburtstage.
                                </p>
                            </div>

                            <button
                                className="wg-btn-secondary"
                                onClick={() => setIsAllEventsOpen(false)}
                            >
                                Schließen
                            </button>
                        </div>

                        {sortedEvents.length === 0 ? (
                            <p className="wg-note">Noch keine Events vorhanden.</p>
                        ) : (
                            <div className="wg-events-list">
                                {sortedEvents.map((event) => {
                                    const canDelete =
                                        !event.isBirthday &&
                                        (wg.currentUserRole === "ADMIN" || user?.id === event.createdById);

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
                                                    {event.isBirthday
                                                        ? "Automatisch aus Geburtsdatum erzeugt"
                                                        : `Erstellt von ${event.createdBy.name}`}
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
                    </div>
                </div>
            )}
        </>
    );
}