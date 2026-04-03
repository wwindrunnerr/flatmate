"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import "./invite.css";

interface InviteClientProps {
    code: string;
}

interface SessionUser {
    id: string;
    email: string;
    name: string;
}

export default function InviteClient({ code }: InviteClientProps) {
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [user, setUser] = useState<SessionUser | null>(null);

    const nextUrl = `/invite/${code}`;

    useEffect(() => {
        async function checkAuth() {
            try {
                const res = await fetch("/api/me", {
                    credentials: "include",
                    cache: "no-store",
                });

                if (!res.ok) {
                    setUser(null);
                    return;
                }

                const data = await res.json();
                setUser(data.user ?? null);
            } catch (error) {
                console.error("INVITE_AUTH_CHECK_ERROR", error);
                setUser(null);
            } finally {
                setCheckingAuth(false);
            }
        }

        checkAuth();
    }, []);

    async function joinWG() {
        setLoading(true);
        setMessage("");

        try {
            const res = await fetch(`/api/invites/${code}/join`, {
                method: "POST",
                credentials: "include",
            });

            const rawText = await res.text();

            let data: any = {};
            try {
                data = rawText ? JSON.parse(rawText) : {};
            } catch (error) {
                console.error("JOIN_INVITE_INVALID_JSON", {
                    status: res.status,
                    rawText,
                    error,
                });
                setMessage("Server hat keine gültige Antwort geliefert.");
                return;
            }

            if (!res.ok) {
                setMessage(data.error || "Beitritt fehlgeschlagen");
                return;
            }

            setMessage("Du bist der WG beigetreten.");

            setTimeout(() => {
                window.location.href = `/wg/${data.wg.id}`;
            }, 700);
        } catch (error) {
            console.error("INVITE_JOIN_PAGE_ERROR", error);
            setMessage("Netzwerkfehler");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="invite-page">
            <div className="invite-card">
                <h1 className="invite-title">WG-Einladung</h1>
                <p className="invite-subtitle">
                    Du wurdest eingeladen, einer WG beizutreten.
                </p>

                <div className="invite-code-box">
                    <span className="invite-code-label">Einladungscode</span>
                    <code className="invite-code">{code}</code>
                </div>

                {checkingAuth ? (
                    <p className="invite-note">Anmeldestatus wird geprüft...</p>
                ) : user ? (
                    <>
                        <p className="invite-note">
                            Eingeloggt als <strong>{user.name}</strong> ({user.email})
                        </p>

                        <button
                            className="invite-btn-primary"
                            onClick={joinWG}
                            disabled={loading}
                        >
                            {loading ? "Wird beigetreten..." : "WG beitreten"}
                        </button>
                    </>
                ) : (
                    <>
                        <p className="invite-note">
                            Du musst angemeldet sein, um der WG beizutreten.
                        </p>

                        <div className="invite-actions">
                            <Link
                                className="invite-btn-primary invite-link-btn"
                                href={`/login?next=${encodeURIComponent(nextUrl)}`}
                            >
                                Anmelden
                            </Link>

                            <Link
                                className="invite-btn-secondary invite-link-btn"
                                href={`/register?next=${encodeURIComponent(nextUrl)}`}
                            >
                                Registrieren
                            </Link>
                        </div>
                    </>
                )}

                {message && (
                    <p
                        className={
                            message.includes("beigetreten") ? "invite-success" : "invite-error"
                        }
                    >
                        {message}
                    </p>
                )}
            </div>
        </main>
    );
}