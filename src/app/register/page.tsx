"use client";
import { useState } from "react";
import "./register.css";

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
                age: form.age ? (form.age) : 0,
                gender: form.gender || "unbekannt",
                email: form.email,
                password: form.password,
            }),
        });

        const data = await response.json();
        setMessage(data.message || data.error || "OK");

        if (data.success) {
            setTimeout(() => (window.location.href = "/"), 1000);
        }
    }

    return (
        <main className="reg-page">
            <div className="register-card">

                {/* ----- HEADER ----- */}
                <h1 className="title">Sign up</h1>
                <p className="subtitle">Sign up, um fortzufahren</p>

                {/* ----- FORM ----- */}
                <input
                    name="name"
                    placeholder="Name"
                    onChange={handleChange}
                    className="input"
                />
                <input
                    name="email"
                    type="email"
                    placeholder="Email"
                    onChange={handleChange}
                    className="input"
                />
                <input
                    name="password"
                    type="password"
                    placeholder="Passwort"
                    onChange={handleChange}
                    className="input"
                />
                <input
                    name="age"
                    type="date"
                    onChange={handleChange}
                    className="input"
                />

                {/* ----- GENDER ----- */}
                <div className="gender-block">
                    <label className="gender-label">Gender:</label>

                    <label className="radio-row">
                        <input type="radio" name="gender" value="männlich" onChange={handleChange}/>
                        Männlich
                    </label>

                    <label className="radio-row">
                        <input type="radio" name="gender" value="weiblich" onChange={handleChange}/>
                        Weiblich
                    </label>

                    <label className="radio-row">
                        <input type="radio" name="gender" value="divers" onChange={handleChange}/>
                        Divers
                    </label>

                    <label className="radio-row">
                        <input type="radio" name="gender" value="keine angabe" onChange={handleChange}/>
                        Keine Angabe
                    </label>
                </div>

                {/* ----- SIGN UP BUTTON ----- */}
                <button className="signup-btn" onClick={handleRegister}>Sign up</button>


                {/* ----- ALREADY HAVE ACCOUNT ----- */}
                <p className="signin-text">
                    Sie haben bereits ein Konto? <a href="/login">Sign in</a>
                </p>

                <p>{message}</p>
            </div>
        </main>
    );
}
