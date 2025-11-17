"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface WG {
    id: string;
    title: string;
    description: string;
    members: string[];
    admin: string;
}

export default function DashboardPage() {
    const [user, setUser] = useState<any>(null);
    const [wgs, setWgs] = useState<WG[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadUser() {
            // Load user using cookie (must include credentials)
            const res = await fetch("/api/me", {
                credentials: "include",
            });

            if (res.status === 401) {
                window.location.href = "/login";
                return;
            }

            const data = await res.json();
            if (!data.user) {
                window.location.href = "/login";
                return;
            }

            setUser(data.user);

            // Now load WGs
            const wgsRes = await fetch("/api/wgs", {
                credentials: "include",
                cache: "no-store",
            });

            const wgsData = await wgsRes.json();

            // Filter WGs where this user is a member
            const myWgs = wgsData.wgs.filter((wg: WG) =>
                wg.members.includes(data.user.email)
            );

            setWgs(myWgs);
            setLoading(false);
        }

        loadUser();
    }, []);

    if (loading || !user) return <p>Lade...</p>;

    const handleLogout = () => {
        document.cookie = "user=; Max-Age=0; path=/;";
        window.location.href = "/";
    };

    return (
        <main>
            <h1>Willkommen, {user.name}!</h1>

            <p><b>E-Mail:</b> {user.email}</p>
            <p><b>Alter:</b> {user.age}</p>
            <p><b>Geschlecht:</b> {user.gender}</p>

            <hr style={{ margin: "20px 0" }} />

            <h2>Deine WGs</h2>

            {wgs.length === 0 && (
                <p>Du bist noch in keiner WG.</p>
            )}

            {wgs.length > 0 && (
                <ul style={{ listStyle: "none", padding: 0 }}>
                    {wgs.map((wg) => (
                        <li key={wg.id} style={{ marginBottom: "10px" }}>
                            <Link href={`/wg/${wg.id}`}>
                                <button style={{ padding: "8px 15px" }}>
                                    {wg.title}
                                </button>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}

            <Link href="/create_wg">
                <button style={{ marginTop: "20px", padding: "10px 20px" }}>
                    Neue WG erstellen
                </button>
            </Link>

            <hr style={{ margin: "20px 0" }} />

            <button onClick={handleLogout}>Abmelden</button>
        </main>
    );
}
