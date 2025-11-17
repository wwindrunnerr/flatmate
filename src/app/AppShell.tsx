"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

    const navClass = (href: string) =>
        `nav-btn ${pathname === href ? "active" : ""}`;

    let headerIcon: ReactNode;
    let headerTitle: string;

    switch (pathname) {
        case "/":
            headerIcon = <HomeIcon className="icon" />;
            headerTitle = "Hallo User!";
            break;
        case "/kosten":
            headerIcon = <DollarSignIcon className="icon" />;
            headerTitle = "Deine Kosten im Überblick";
            break;
        case "/putzplan":
            headerIcon = <ClipboardIcon className="icon" />;
            headerTitle = "Putzplan für deine WG";
            break;
        case "/einkaufsliste":
            headerIcon = <ShoppingCartIcon className="icon" />;
            headerTitle = "Einkaufsliste";
            break;
        default:
            headerIcon = <HomeIcon className="icon" />;
            headerTitle = "WG-App";
    }

    return (
        <div className="layout-container">
            <nav className="sidebar">
                <Link href="/" className={navClass("/")}>
                    <HomeIcon className="icon" />
                    <span>Home</span>
                </Link>

                <Link href="/kosten" className={navClass("/kosten")}>
                    <DollarSignIcon className="icon" />
                    <span>Kosten</span>
                </Link>

                <Link href="/putzplan" className={navClass("/putzplan")}>
                    <ClipboardIcon className="icon" />
                    <span>Putzplan</span>
                </Link>

                <Link href="/einkaufsliste" className={navClass("/einkaufsliste")}>
                    <ShoppingCartIcon className="icon" />
                    <span>Einkaufsliste</span>
                </Link>
            </nav>

            <div className="page">
                <div className="header">
                    {headerIcon}
                    <h1 className="title">{headerTitle}</h1>
                    <Link href="/dashboard">
                        <ProfileIcon className="avatar" />
                    </Link>
                </div>

                <main className="content">{children}</main>
            </div>
        </div>
    );
}
