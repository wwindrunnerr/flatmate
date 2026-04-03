"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import "../register/register.css";

export default function LoginPage() {
    const searchParams = useSearchParams();
    const nextUrl = searchParams.get("next");

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleLogin() {
        setMessage("");
        setLoading(true);

        try {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                setMessage(data.error || "Fehler beim Login");
                return;
            }

            window.location.href = nextUrl || "/user";
        } catch (error) {
            console.error("LOGIN_PAGE_ERROR", error);
            setMessage("Netzwerkfehler beim Login");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="reg-page">
            <div className="register-card">
                <h1 className="title">Sign In</h1>
                <p className="subtitle">Melde dich an, um fortzufahren</p>

                <input
                    className="input"
                    placeholder="E-Mail"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                />

                <input
                    className="input"
                    placeholder="Passwort"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                />

                <button className="signup-btn" onClick={handleLogin} disabled={loading}>
                    {loading ? "Anmelden..." : "Anmelden"}
                </button>

                <p className="signin-text">
                    Noch kein Konto?{" "}
                    <Link href={nextUrl ? `/register?next=${encodeURIComponent(nextUrl)}` : "/register"}>
                        Jetzt registrieren
                    </Link>
                </p>

                {message && <p>{message}</p>}
            </div>
        </main>
    );
}