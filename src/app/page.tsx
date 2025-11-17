"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function LandingPage() {
    const [loggedIn, setLoggedIn] = useState(false);

    useEffect(() => {
        setLoggedIn(!!localStorage.getItem("user"));
    }, []);

    return (
        <main>
            <h1>Willkommen zur WG-App</h1>

            {!loggedIn && (
                <div>
                    <Link href="/login">
                        <button>Login</button>
                    </Link>

                    <Link href="/register">
                        <button>Registrieren</button>
                    </Link>
                </div>
            )}

            {loggedIn && (
                <div>
                    <Link href="/user">
                        <button>Zum User</button>
                    </Link>
                </div>
            )}
        </main>
    );
}
