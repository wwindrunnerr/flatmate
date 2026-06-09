"use client";

import React, { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";

const SpotifyIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: "10px" }}>
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.84.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.84.241 1.2zM19.08 10.5c-3.96-2.28-10.44-2.46-14.16-1.38-.6.18-1.14-.12-1.32-.72-.18-.6.12-1.14.72-1.32 4.32-1.2 11.28-1.02 15.72 1.56.54.3.72 1.02.42 1.56-.24.48-.9.66-1.38.3z" />
    </svg>
);

export default function MusikPage({ params }: { params: { id: string } }) {
    const { data: session, status } = useSession();
    const [role, setRole] = useState<"NONE" | "DJ" | "LISTENER">("NONE");
    
    const [currentSong, setCurrentSong] = useState<any>({
        title: "Noch kein Song",
        artist: "-",
        isPlaying: false,
        progress: 0,
        albumArt: null
    });

    // --- LIVE DATEN VON SPOTIFY HOLEN ---
    const fetchCurrentSong = async () => {
        const accessToken = (session as any)?.accessToken;
        if (!accessToken) return;

        try {
            const res = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            // 204 No Content bedeutet, dass gerade nichts abgespielt wird
            if (res.status === 204) {
                setCurrentSong({ title: "Pause", artist: "-", isPlaying: false, progress: 0, albumArt: null });
                return;
            }

            const data = await res.json();
            if (data && data.item) {
                setCurrentSong({
                    title: data.item.name,
                    artist: data.item.artists.map((a: any) => a.name).join(", "),
                    isPlaying: data.is_playing,
                    progress: (data.progress_ms / data.item.duration_ms) * 100,
                    albumArt: data.item.album.images[0]?.url
                });
            }
        } catch (error) {
            console.error("Fehler beim Abrufen der Musik:", error);
        }
    };

    // Polling: Alle 3 Sekunden aktualisieren, wenn ein Modus aktiv ist
    useEffect(() => {
        if (status === "authenticated" && role !== "NONE") {
            fetchCurrentSong(); // Erster Aufruf
            const interval = setInterval(fetchCurrentSong, 3000);
            return () => clearInterval(interval);
        }
    }, [status, role]);

    const handleSpotifyConnect = () => signIn("spotify");

    const handleStartSession = () => setRole("DJ");
    const handleJoinSession = () => setRole("LISTENER");

    const handleLeaveSession = () => {
        setRole("NONE");
        setCurrentSong({ title: "Noch kein Song", artist: "-", isPlaying: false, progress: 0, albumArt: null });
    };

    if (status === "loading") return <div className="user-page">Lade Musik-Status...</div>;

    return (
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <div>
                    <h2 style={{ fontSize: "1.8rem", fontWeight: "bold", color: "#333" }}>WG Audio-Sync</h2>
                    <p style={{ color: "#666" }}>Höre synchron Musik mit deiner WG.</p>
                </div>
                {!session ? (
                    <button 
                        onClick={handleSpotifyConnect}
                        style={{ 
                            display: "flex", alignItems: "center", backgroundColor: "#1DB954", 
                            color: "white", padding: "10px 20px", borderRadius: "30px", 
                            fontWeight: "bold", border: "none", cursor: "pointer", 
                            boxShadow: "0 4px 10px rgba(29, 185, 84, 0.3)" 
                        }}
                    >
                        <SpotifyIcon /> Mit Spotify verbinden
                    </button>
                ) : (
                    <div style={{ display: "flex", alignItems: "center", color: "#1DB954", fontWeight: "bold" }}>
                        <SpotifyIcon /> Verbunden als {session.user?.name}
                    </div>
                )}
            </div>

            {session && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
                    
                    {/* NOW PLAYING CARD */}
                    <div style={{ backgroundColor: "white", padding: "2rem", borderRadius: "12px", border: "1px solid #eee", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "25px" }}>
                            {/* Album Cover */}
                            <div style={{ 
                                width: "120px", height: "120px", backgroundColor: "#333", 
                                borderRadius: "8px", display: "flex", alignItems: "center", 
                                justifyContent: "center", overflow: "hidden", boxShadow: "0 4px 10px rgba(0,0,0,0.2)" 
                            }}>
                                {currentSong.albumArt ? (
                                    <img src={currentSong.albumArt} alt="Cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                ) : (
                                    <span style={{ fontSize: "2.5rem" }}>🎵</span>
                                )}
                            </div>
                            
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: "0.9rem", color: "#1DB954", fontWeight: "bold", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "1px" }}>
                                    {role === "DJ" ? "Du bist der DJ" : role === "LISTENER" ? "Sync aktiv" : "Bereit zum Abspielen"}
                                </div>
                                <h3 style={{ fontSize: "1.6rem", margin: "0 0 5px 0", color: "black" }}>{currentSong.title}</h3>
                                <p style={{ color: "#666", margin: 0, fontSize: "1.1rem" }}>{currentSong.artist}</p>
                                
                                {role !== "NONE" && (
                                    <div style={{ marginTop: "15px", height: "6px", backgroundColor: "#eee", borderRadius: "3px", overflow: "hidden" }}>
                                        <div style={{ 
                                            width: `${currentSong.progress}%`, 
                                            height: "100%", 
                                            backgroundColor: "#1DB954", 
                                            transition: "width 0.5s ease-out" 
                                        }}></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* SELECTION AREA */}
                    {role === "NONE" && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                            <div style={{ backgroundColor: "white", padding: "1.5rem", borderRadius: "12px", border: "1px solid #eee", textAlign: "center" }}>
                                <h3 style={{ marginBottom: "10px", color: "black" }}>Werde der DJ</h3>
                                <p style={{ color: "#666", fontSize: "0.85rem", marginBottom: "20px" }}>Teile deinen Live-Status mit der WG.</p>
                                <button onClick={handleStartSession} className="btn-primary" style={{ width: "100%" }}>Musik teilen</button>
                            </div>
                            <div style={{ backgroundColor: "white", padding: "1.5rem", borderRadius: "12px", border: "1px solid #eee", textAlign: "center" }}>
                                <h3 style={{ marginBottom: "10px", color: "black" }}>Einklinken</h3>
                                <p style={{ color: "#666", fontSize: "0.85rem", marginBottom: "20px" }}>Höre synchron bei einem Mitbewohner mit.</p>
                                <button onClick={handleJoinSession} className="btn-secondary" style={{ width: "100%" }}>Sync starten</button>
                            </div>
                        </div>
                    )}

                    {role !== "NONE" && (
                        <button 
                            onClick={handleLeaveSession} 
                            style={{ 
                                padding: "12px", backgroundColor: "#fff", border: "1px solid #ff4d4f", 
                                color: "#ff4d4f", borderRadius: "8px", fontWeight: "bold", cursor: "pointer",
                                marginTop: "10px"
                            }}
                        >
                            Session beenden
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}