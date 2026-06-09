"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    
    // Holt das "token" aus der URL (z.B. /reset-password?token=12345)
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErrorMsg("");

        if (!token) {
            setErrorMsg("Kein Reset-Token in der URL gefunden.");
            return;
        }

        if (password.length < 6) {
            setErrorMsg("Das Passwort muss mindestens 6 Zeichen lang sein.");
            return;
        }

        if (password !== confirmPassword) {
            setErrorMsg("Die Passwörter stimmen nicht überein.");
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch("/api/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setErrorMsg(data.error || "Ein Fehler ist aufgetreten.");
                setIsLoading(false);
                return;
            }

            // Bei Erfolg
            setSuccess(true);
            setIsLoading(false);
            
            // Nach 3 Sekunden automatisch zum Login weiterleiten
            setTimeout(() => {
                router.push("/login");
            }, 3000);

        } catch (err) {
            console.error("RESET_SUBMIT_ERROR", err);
            setErrorMsg("Verbindungsfehler zum Server.");
            setIsLoading(false);
        }
    }

    // Wenn kein Token in der URL steht (User hat den Link manuell aufgerufen)
    if (!token) {
        return (
            <div style={{ textAlign: "center", padding: "2rem" }}>
                <h2 style={{ color: "red", marginBottom: "1rem" }}>Ungültiger Link</h2>
                <p>Es wurde kein gültiges Reset-Token übergeben.</p>
                <Link href="/login" style={{ color: "#007bff", textDecoration: "underline", display: "inline-block", marginTop: "1rem" }}>
                    Zurück zum Login
                </Link>
            </div>
        );
    }

    if (success) {
        return (
            <div style={{ textAlign: "center", padding: "2rem", color: "green" }}>
                <h2 style={{ marginBottom: "1rem" }}>Passwort erfolgreich geändert!</h2>
                <p>Du wirst in wenigen Sekunden zum Login weitergeleitet...</p>
                <Link href="/login" style={{ color: "#007bff", textDecoration: "underline", display: "inline-block", marginTop: "1rem" }}>
                    Jetzt anmelden
                </Link>
            </div>
        );
    }

    const inputStyle = { 
        width: "100%", padding: "0.8rem", marginTop: "0.3rem", 
        marginBottom: "1rem", border: "1px solid #ccc", borderRadius: "6px" 
    };

    return (
        <form onSubmit={handleSubmit}>
            <label style={{ display: "block", fontWeight: "bold" }}>Neues Passwort</label>
            <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
                placeholder="Mindestens 6 Zeichen"
            />

            <label style={{ display: "block", fontWeight: "bold" }}>Neues Passwort bestätigen</label>
            <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={inputStyle}
                placeholder="Passwort wiederholen"
            />

            {errorMsg && (
                <div style={{ color: "red", backgroundColor: "#ffe6e6", padding: "0.5rem", borderRadius: "4px", marginBottom: "1rem" }}>
                    {errorMsg}
                </div>
            )}

            <button
                type="submit"
                disabled={isLoading}
                style={{ 
                    width: "100%", padding: "0.8rem", background: "#8e24aa", color: "white", 
                    border: "none", borderRadius: "6px", fontWeight: "bold", cursor: isLoading ? "not-allowed" : "pointer" 
                }}
            >
                {isLoading ? "Wird gespeichert..." : "Passwort zurücksetzen"}
            </button>
        </form>
    );
}

// Die Hauptkomponente, die die Form in einen Suspense-Block einhüllt (Next.js Best Practice)
export default function ResetPasswordPage() {
    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f4f4f4" }}>
            <div style={{ background: "white", padding: "2.5rem", borderRadius: "12px", width: "90%", maxWidth: "450px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", color: "#333" }}>
                <h1 style={{ textAlign: "center", marginBottom: "1.5rem", fontSize: "1.5rem" }}>Passwort zurücksetzen</h1>
                
                <Suspense fallback={<div style={{ textAlign: "center" }}>Lade...</div>}>
                    <ResetPasswordForm />
                </Suspense>
                
            </div>
        </div>
    );
}