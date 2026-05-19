import { Suspense } from "react";
import RegisterPageClient from "./RegisterPageClient";

export default function RegisterPage() {
    return (
        <Suspense fallback={<main className="reg-page"><div className="register-card"><p>Lade Registrierung...</p></div></main>}>
            <RegisterPageClient />
        </Suspense>
    );
}