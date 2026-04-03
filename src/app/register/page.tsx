"use client";

import { ChangeEvent, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import "./register.css";

interface RegisterForm {
    name: string;
    email: string;
    password: string;
    birthDate: string;
}

interface RegisterResponse {
    success?: boolean;
    error?: string;
    fields?: Record<string, string[] | undefined>;
    user?: {
        id: string;
        email: string;
        name: string;
        birthDate: string | null;
        avatarUrl: string | null;
        createdAt: string;
    };
}

export default function RegisterPage() {
    const searchParams = useSearchParams();
    const nextUrl = searchParams.get("next");

    const [form, setForm] = useState<RegisterForm>({
        name: "",
        email: "",
        password: "",
        birthDate: "",
    });

    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});

    function handleChange(e: ChangeEvent<HTMLInputElement>) {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));

        setFieldErrors((prev) => ({
            ...prev,
            [name]: undefined,
        }));

        setMessage("");
    }

    async function handleRegister() {
        setLoading(true);
        setMessage("");
        setFieldErrors({});

        try {
            const response = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(form),
            });

            const data: RegisterResponse = await response.json();

            if (!response.ok) {
                if (data.fields) {
                    setFieldErrors(data.fields);
                }

                setMessage(data.error || "Registrierung fehlgeschlagen");
                return;
            }

            setMessage("Registrierung erfolgreich.");

            setTimeout(() => {
                window.location.href = nextUrl || "/user";
            }, 700);
        } catch (error) {
            console.error("REGISTER_PAGE_ERROR", error);
            setMessage("Netzwerkfehler bei der Registrierung");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="reg-page">
            <div className="register-card">
                <h1 className="title">Sign Up</h1>
                <p className="subtitle">Erstelle dein Konto und starte mit deiner WG</p>

                <input
                    className="input"
                    name="name"
                    type="text"
                    placeholder="Name"
                    value={form.name}
                    onChange={handleChange}
                    disabled={loading}
                />
                {fieldErrors.name?.map((err, index) => (
                    <p key={`name-error-${index}`} className="error-text">
                        {err}
                    </p>
                ))}

                <input
                    className="input"
                    name="email"
                    type="email"
                    placeholder="E-Mail"
                    value={form.email}
                    onChange={handleChange}
                    disabled={loading}
                />
                {fieldErrors.email?.map((err, index) => (
                    <p key={`email-error-${index}`} className="error-text">
                        {err}
                    </p>
                ))}

                <input
                    className="input"
                    name="password"
                    type="password"
                    placeholder="Passwort"
                    value={form.password}
                    onChange={handleChange}
                    disabled={loading}
                />
                {fieldErrors.password?.map((err, index) => (
                    <p key={`password-error-${index}`} className="error-text">
                        {err}
                    </p>
                ))}

                <input
                    className="input"
                    name="birthDate"
                    type="text"
                    placeholder="Geburtsdatum (TT.MM.JJJJ)"
                    value={form.birthDate}
                    onChange={handleChange}
                    disabled={loading}
                />
                {fieldErrors.birthDate?.map((err, index) => (
                    <p key={`birthDate-error-${index}`} className="error-text">
                        {err}
                    </p>
                ))}

                <button className="signup-btn" onClick={handleRegister} disabled={loading}>
                    {loading ? "Wird erstellt..." : "Sign up"}
                </button>

                <p className="signin-text">
                    Sie haben bereits ein Konto?{" "}
                    <Link
                        href={nextUrl ? `/login?next=${encodeURIComponent(nextUrl)}` : "/login"}
                    >
                        Sign in
                    </Link>
                </p>

                {message && (
                    <p className={message.includes("erfolgreich") ? "success-text" : "error-text"}>
                        {message}
                    </p>
                )}
            </div>
        </main>
    );
}