import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { HomeIcon } from "@/components/icons/HomeIcon";
import { DollarSignIcon } from "@/components/icons/DollarSignIcon";
import { ClipboardIcon } from "@/components/icons/ClipboardIcon";
import { ShoppingCartIcon } from "@/components/icons/ShoppingCartIcon";
import {ProfileIcon} from "@/components/icons/ProfileIcon";

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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
          <div className="layout-container">
              <nav className="sidebar">
                  <Link href="/" className="nav-btn active">
                      <HomeIcon className="icon" />
                      <span>Home</span>
                  </Link>

                  <Link href="/kosten" className="nav-btn">
                      <DollarSignIcon className="icon" />
                      <span>Kosten</span>
                  </Link>

                  <Link href="/putzplan" className="nav-btn">
                      <ClipboardIcon className="icon" />
                      <span>Putzplan</span>
                  </Link>

                  <Link href="/einkaufsliste" className="nav-btn">
                      <ShoppingCartIcon className="icon" />
                      <span>Einkaufsliste</span>
                  </Link>
              </nav>
              <div className="page">
                  <div className="header">
                      <HomeIcon className="icon"></HomeIcon>
                      <h1 className="title">Hallo User!</h1>
                      <Link href={"/dashboard"}><ProfileIcon className="avatar"></ProfileIcon></Link>
                  </div>
                  <main className="content">
                      {children}
                  </main>
              </div>
          </div>
      </body>
    </html>
  );
}
