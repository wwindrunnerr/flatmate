"use client";
import { useEffect, useState } from "react";
import { User } from "@/models/user";

export default function DashboardPage() {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem("user");
        if (stored) setUser(JSON.parse(stored));
        else window.location.href = "/";
    }, []);

    if (!user) return <p>Lade...</p>;

    const handleLogout = () => {
        localStorage.removeItem("user");
        window.location.href = "/";
    };

    return (
        <main>
            <h1>Willkommen, {user.name}!</h1>
            <div>
                <p><b>Alter:</b> {user.age}</p>
                <p><b>Geschlecht:</b> {user.gender}</p>
                <p><b>E-Mail:</b> {user.email}</p>
            </div>

            <button onClick={handleLogout}>Abmelden</button>
        </main>
    );
}
