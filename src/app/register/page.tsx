"use client";
import { useState } from "react";
import Card from "@/components/Card";

export default function RegisterPage() {
    const [form, setForm] = useState({
        name: "",
        age: "",
        gender: "",
        email: "",
        password: "",
    });
    const [message, setMessage] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    async function handleRegister() {
        const response = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: form.name,
                age: form.age ? Number(form.age) : 0,
                gender: form.gender || "unbekannt",
                email: form.email,
                password: form.password,
            }),
        });
        const data = await response.json();
        setMessage(data.message || data.error || "OK");
        if (data.success) {
            setTimeout(() => (window.location.href = "/dashboard"), 1000);
        }
    }

    // HTML
    return (
        <main>
            <h2>Registrierung</h2>

            <input name="name" placeholder="Name" onChange={handleChange} />
            <br/>
            <input name="age" placeholder="Alter" onChange={handleChange} />
            <br/>
            <input name="gender" placeholder="Geschlecht" onChange={handleChange} />
            <br/>
            <input name="email" type="email" placeholder="E-Mail" onChange={handleChange} />
            <br/>
            <input
                name="password"
                type="password"
                placeholder="Passwort"
                onChange={handleChange}
            />
            <br/>

            <button onClick={handleRegister}> Registrieren </button>

            <p>{message}</p>
        </main>
    );
}
