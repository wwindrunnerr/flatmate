"use client";

import { ChangeEvent, useState } from "react";
import Link from "next/link";
import "./create_wg.css";

interface CreateWGForm {
    title: string;
    description: string;
}

interface CreateWGResponse {
    success?: boolean;
    error?: string;
    fields?: Record<string, string[] | undefined>;
    wg?: {
        id: string;
        title: string;
        description: string | null;
        createdAt: string;
        updatedAt: string;
    };
}

export default function CreateWGPage() {
    const [form, setForm] = useState<CreateWGForm>({
        title: "",
        description: "",
    });

    const [message, setMessage] = useState("");
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});
    const [loading, setLoading] = useState(false);

    function handleChange(
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) {
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

    async function createWG() {
        setLoading(true);
        setMessage("");
        setFieldErrors({});

        try {
            const res = await fetch("/api/create_wg", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(form),
            });

            const data: CreateWGResponse = await res.json();

            if (!res.ok) {
                if (data.fields) {
                    setFieldErrors(data.fields);
                }

                setMessage(data.error || "Fehler beim Erstellen der WG");
                return;
            }

            setMessage("WG erfolgreich erstellt.");

            setTimeout(() => {
                window.location.href = "/user";
            }, 700);
        } catch (error) {
            console.error("CREATE_WG_PAGE_ERROR", error);
            setMessage("Netzwerkfehler beim Erstellen der WG");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="create-wg-page">
            <div className="create-wg-card">
                <h1 className="create-wg-title">Neue WG erstellen</h1>
                <p className="create-wg-subtitle">
                    Erstelle deine WG und lade später weitere Mitglieder per Link oder Code ein.
                </p>

                <div className="create-wg-form">
                    <div className="form-group">
                        <label className="form-label" htmlFor="title">
                            WG-Name
                        </label>
                        <input
                            id="title"
                            name="title"
                            className="form-input"
                            placeholder="z. B. WG Karlsruhe Innenstadt"
                            value={form.title}
                            onChange={handleChange}
                            disabled={loading}
                        />
                        <p className="form-help">
                            Wähle einen klaren und kurzen Namen für deine WG.
                        </p>
                        {fieldErrors.title?.map((err, index) => (
                            <p key={`title-error-${index}`} className="form-error">
                                {err}
                            </p>
                        ))}
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="description">
                            Beschreibung
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            className="form-textarea"
                            placeholder="Kurze Beschreibung, Regeln oder Infos zur WG"
                            value={form.description}
                            onChange={handleChange}
                            disabled={loading}
                        />
                        <p className="form-help">
                            Optional. Du kannst hier später auch Regeln oder Hinweise ergänzen.
                        </p>
                        {fieldErrors.description?.map((err, index) => (
                            <p key={`description-error-${index}`} className="form-error">
                                {err}
                            </p>
                        ))}
                    </div>

                    {message && (
                        <p className={message.includes("erfolgreich") ? "form-success" : "form-error"}>
                            {message}
                        </p>
                    )}

                    <div className="create-wg-actions">
                        <Link href="/user" style={{ flex: 1 }}>
                            <button
                                type="button"
                                className="create-wg-btn-secondary"
                                disabled={loading}
                                style={{ width: "100%" }}
                            >
                                Abbrechen
                            </button>
                        </Link>

                        <button
                            type="button"
                            className="create-wg-btn-primary"
                            onClick={createWG}
                            disabled={loading}
                        >
                            {loading ? "Wird erstellt..." : "WG erstellen"}
                        </button>
                    </div>
                </div>

                <p className="create-wg-footer">
                    Nach dem Erstellen wirst du automatisch als Admin hinzugefügt.
                </p>
            </div>
        </main>
    );
}