"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { HomeIcon } from "@/components/icons/HomeIcon";
import { DollarSignIcon } from "@/components/icons/DollarSignIcon";
import { ClipboardIcon } from "@/components/icons/ClipboardIcon";
import { ShoppingCartIcon } from "@/components/icons/ShoppingCartIcon";
import { ProfileIcon } from "@/components/icons/ProfileIcon";
import { ReactNode } from "react";

type Props = {
    children: ReactNode;
};

export default function AppShell({ children }: Props) {
    const pathname = usePathname();
    const params = useParams<{ id: string }>();

    const id = params.id;
    const base = `/wg/${id}`;

    const isActive = (subPath: string) => {
        const target = base + subPath;
        return pathname === target;
    };

    const navClass = (subPath: string) =>
        `nav-btn ${isActive(subPath) ? "active" : ""}`;

    let headerIcon: ReactNode;
    let headerTitle: string;
    let headerSubtitle = "Verwalte deine WG zentral an einem Ort.";

    switch (true) {
        case isActive(""):
            headerIcon = <HomeIcon className="icon" />;
            headerTitle = "Hallo in deiner WG!";
            headerSubtitle = "Hier findest du Übersicht, Mitglieder und Einladungen.";
            break;
        case isActive("/kosten"):
            headerIcon = <DollarSignIcon className="icon" />;
            headerTitle = "Kosten";
            headerSubtitle = "Behalte Ausgaben, Schulden und Ausgleich im Blick.";
            break;
        case isActive("/putzplan"):
            headerIcon = <ClipboardIcon className="icon" />;
            headerTitle = "Putzplan";
            headerSubtitle = "Organisiere Aufgaben fair und nachvollziehbar.";
            break;
        case isActive("/einkaufsliste"):
            headerIcon = <ShoppingCartIcon className="icon" />;
            headerTitle = "Einkaufsliste";
            headerSubtitle = "Plane Einkäufe gemeinsam mit deiner WG.";
            break;
        default:
            headerIcon = <HomeIcon className="icon" />;
            headerTitle = "WG-App";
    }

    return (
        <div className="wg-layout">
            <nav className="wg-sidebar">
                <div className="wg-sidebar-title">Navigation</div>

                <Link href={base} className={navClass("")}>
                    <HomeIcon className="icon" />
                    <span>Home</span>
                </Link>

                <Link href={`${base}/kosten`} className={navClass("/kosten")}>
                    <DollarSignIcon className="icon" />
                    <span>Kosten</span>
                </Link>

                <Link href={`${base}/putzplan`} className={navClass("/putzplan")}>
                    <ClipboardIcon className="icon" />
                    <span>Putzplan</span>
                </Link>

                <Link
                    href={`${base}/einkaufsliste`}
                    className={navClass("/einkaufsliste")}
                >
                    <ShoppingCartIcon className="icon" />
                    <span>Einkaufsliste</span>
                </Link>
            </nav>

            <div className="wg-page">
                <header className="wg-header">
                    <div className="wg-header-main">
                        {headerIcon}
                        <div>
                            <h1 className="wg-title">{headerTitle}</h1>
                            <p className="wg-subtitle">{headerSubtitle}</p>
                        </div>
                    </div>

                    <div className="wg-header-actions">
                        <Link href="/user" className="wg-profile-link">
                            <div className="wg-avatar">
                                <ProfileIcon className="avatar" />
                            </div>
                        </Link>
                    </div>
                </header>

                <main className="wg-content">{children}</main>
            </div>
        </div>
    );
}