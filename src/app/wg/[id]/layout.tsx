import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AppShell from "./AppShell";
import "./wg.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "WG-App",
    description: "WG Management",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className={`${geistSans.variable} ${geistMono.variable}`}>
            <AppShell>{children}</AppShell>
        </div>
    );
}