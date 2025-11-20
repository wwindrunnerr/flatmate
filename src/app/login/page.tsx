"use client";
import { useState } from "react";
import Link from "next/link";
import "../register/register.css";


export default function LoginPage() {
    // 3 Variablen, die am Anfang "" sind
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMsg] = useState("");

    async function handleLogin() {
        const response = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        const data = await response.json();

        if (data.success) {
            localStorage.setItem("user", JSON.stringify(data.user));
            window.location.href = "/user";
        } else {
            setMsg(data.error || "Fehler beim Login");
        }
    }

    return (
        <main className="reg-page">
            <div className="register-card">
                {/* ----- HEADER ----- */}
                <h1 className="title">Sign In</h1>
                <p className="subtitle">Melde dich an, um fortzufahren</p>

                {/* ----- FORM ----- */}
                <input
                    className="input"
                    placeholder="E-Mail"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <input
                    className="input"
                    placeholder="Passwort"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                {/* ----- LOGIN BUTTON ----- */}
                <button className="signup-btn" onClick={handleLogin}>
                    Anmelden
                </button>

                {/* ----- SWITCH TO REGISTER ----- */}
                <p className="signin-text">
                    Noch kein Konto?{" "}
                    <Link href="/register">Jetzt registrieren</Link>
                </p>

                <p>{message}</p>
            </div>
        </main>
    );
}