"use client";
import { useState } from "react";
import Link from "next/link";


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
            window.location.href = "/dashboard";
        } else {
            setMsg(data.error || "Fehler beim Login");
        }
    }

    return (
        <main>
            <h2>Login Page</h2>
            <input
                placeholder="E-Mail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <br/>
            <input
                placeholder="Passwort"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <br/>
            <button onClick={handleLogin}> Anmelden </button>
            <p>{message}</p>

            <Link href="/register">Noch kein Konto? Registriere ein!</Link>
        </main>
    );
}