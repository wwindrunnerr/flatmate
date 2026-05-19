import { Suspense } from "react";
import LoginPageClient from "./LoginPageClient";

export default function LoginPage() {
    return (
        <Suspense fallback={<main className="reg-page"><div className="register-card"><p>Lade Login...</p></div></main>}>
            <LoginPageClient />
        </Suspense>
    );
}