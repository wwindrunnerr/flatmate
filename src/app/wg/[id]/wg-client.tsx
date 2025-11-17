"use client";

import { useEffect, useState } from "react";

export default function WGClientPage({ id }: { id: string }) {
    const [wg, setWG] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadWg() {
            const res = await fetch(`/api/wgs/${id}`, {
                credentials: "include",
                cache: "no-store",
            });

            if (res.status === 401) {
                window.location.href = "/login";
                return;
            }

            if (res.status === 403) {
                setError("Du hast keinen Zugriff auf diese WG.");
                setLoading(false);
                return;
            }

            if (res.status === 404) {
                setError("WG nicht gefunden.");
                setLoading(false);
                return;
            }

            const data = await res.json();
            setWG(data.wg);
            setLoading(false);
        }

        loadWg();
    }, [id]);

    if (loading) return <p>Lade WG...</p>;
    if (error) return <p style={{ color: "red" }}>{error}</p>;

    return (
        <div className="page">
            <h1>{wg.title}</h1>
            <p>{wg.description}</p>

            <div className="grid">
                <div className="widget">
                    <h2>Budget</h2>
                    <div className="row">
                        <span>Zum Denis</span>
                        <span>78 €</span>
                    </div>
                    <div className="row">
                        <span>Zum Yaroslav</span>
                        <span>67 €</span>
                    </div>
                    <div className="row">
                        <span>Von Mykyta</span>
                        <span>2000 €</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
