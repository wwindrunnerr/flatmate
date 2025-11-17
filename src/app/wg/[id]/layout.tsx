import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AppShell from "../../../components/AppShell"; // новый компонент

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

        <AppShell>{children}</AppShell>

    );
}
