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

    const id = params.id; // current WG id from /wg/[id]/...

    const base = `/wg/${id}`; // e.g. /wg/123

    const isActive = (subPath: string) => {
        const target = base + subPath;   // "" | "/kosten" | "/putzplan" | "/einkaufsliste"
        return pathname === target;
    };

    const navClass = (subPath: string) =>
        `nav-btn ${isActive(subPath) ? "active" : ""}`;

    let headerIcon: ReactNode;
    let headerTitle: string;

    switch (true) {
        case isActive(""):
            headerIcon = <HomeIcon className="icon" />;
            headerTitle = "Hallo User!";
            break;
        case isActive("/kosten"):
            headerIcon = <DollarSignIcon className="icon" />;
            headerTitle = "Deine Kosten im Überblick";
            break;
        case isActive("/putzplan"):
            headerIcon = <ClipboardIcon className="icon" />;
            headerTitle = "Putzplan für deine WG";
            break;
        case isActive("/einkaufsliste"):
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

            <div className="page">
                <div className="header">
                    {headerIcon}
                    <h1 className="title">{headerTitle}</h1>
                    <Link href="/user">
                        <ProfileIcon className="avatar" />
                    </Link>
                </div>

                <main className="content">{children}</main>
            </div>
        </div>
    );
}
