"use client";

import { useState } from "react";

export default function CreateWGPage() {
    const [form, setForm] = useState({
        title: "",
        description: "",
    });

    const [msg, setMsg] = useState("");

    const handleChange = (e: any) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    async function createWG() {
        const res = await fetch("api/create_wg", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });

        const data = await res.json();

        if (!data.success) {
            setMsg(data.error || "Fehler");
            return;
        }

        setMsg("WG erstellt!");

        // redirect to user dashboard or WG page
        setTimeout(() => {
            window.location.href = "/user";
        }, 800);
    }

    return (
        <main style={{ padding: "20px" }}>
            <h1>Neue WG erstellen</h1>

            <input
                name="title"
                placeholder="WG Titel"
                value={form.title}
                onChange={handleChange}
                style={{ display: "block", margin: "10px 0", padding: "8px" }}
            />

            <textarea
                name="description"
                placeholder="WG Beschreibung"
                value={form.description}
                onChange={handleChange}
                style={{ display: "block", margin: "10px 0", padding: "8px" }}
            />

            <button onClick={createWG} style={{ padding: "8px 15px" }}>
                WG erstellen
            </button>

            <p>{msg}</p>
        </main>
    );
}
