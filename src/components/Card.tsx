import React from "react";

export default function Card({ children }: { children: React.ReactNode }) {
    return (
        <div
            style={{
                background: "var(--bg-blur)",
                backdropFilter: "blur(10px)",
                borderRadius: "var(--radius)",
                boxShadow: "var(--shadow)",
                border: "1px solid var(--border)",
                padding: "2rem",
                width: "350px",
                textAlign: "center",
            }}
        >
            {children}
        </div>
    );
}
