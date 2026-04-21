"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type WGMember = {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "MEMBER";
};

type WGResponse = {
    wg: {
        id: string;
        title: string;
        currentUserRole: "ADMIN" | "MEMBER";
        members: WGMember[];
    };
};

type Assignment = {
    userId: string;
    userName: string;
    room: string | null;
};

type WeekPlan = {
    weekLabel: string;
    dateRange: string;
    assignments: Assignment[];
    unassignedRooms: string[];
};

const STORAGE_PREFIX = "flatmate_putzplan_rooms_";
const DEFAULT_ROOMS = ["Küche", "Bad", "Wohnzimmer"];

function getMonday(date: Date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function addDays(date: Date, days: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

function formatDate(date: Date) {
    return new Intl.DateTimeFormat("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
    }).format(date);
}

function formatWeekRange(start: Date) {
    const end = addDays(start, 6);
    return `${formatDate(start)} – ${formatDate(end)}`;
}

function rotateArray<T>(arr: T[], offset: number): T[] {
    if (arr.length === 0) return [];
    const normalized = ((offset % arr.length) + arr.length) % arr.length;
    return [...arr.slice(normalized), ...arr.slice(0, normalized)];
}

function buildSchedule(
    members: WGMember[],
    rooms: string[],
    weekCount: number
): WeekPlan[] {
    if (members.length === 0) return [];

    const cleanedRooms = rooms.map((r) => r.trim()).filter(Boolean);
    const slotCount = Math.max(members.length, cleanedRooms.length, 1);

    const paddedRooms: (string | null)[] = [
        ...cleanedRooms,
        ...Array(Math.max(0, slotCount - cleanedRooms.length)).fill(null),
    ];

    const startMonday = getMonday(new Date());

    return Array.from({ length: weekCount }, (_, weekIndex) => {
        const rotatedRooms = rotateArray(paddedRooms, weekIndex);
        const weekStart = addDays(startMonday, weekIndex * 7);

        const assignments: Assignment[] = members.map((member, memberIndex) => ({
            userId: member.id,
            userName: member.name,
            room: rotatedRooms[memberIndex] ?? null,
        }));

        const unassignedRooms = rotatedRooms
            .slice(members.length)
            .filter((room): room is string => Boolean(room));

        return {
            weekLabel: `KW ${weekIndex + 1}`,
            dateRange: formatWeekRange(weekStart),
            assignments,
            unassignedRooms,
        };
    });
}

export default function PutzplanPage() {
    const params = useParams<{ id: string }>();
    const wgId = params.id;

    const [members, setMembers] = useState<WGMember[]>([]);
    const [currentUserRole, setCurrentUserRole] = useState<"ADMIN" | "MEMBER" | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [rooms, setRooms] = useState<string[]>(DEFAULT_ROOMS);
    const [newRoomName, setNewRoomName] = useState("");
    const [isEditorOpen, setIsEditorOpen] = useState(false);

    const weekCount = 6;

    useEffect(() => {
        async function loadWG() {
            try {
                const res = await fetch(`/api/wgs/${wgId}`, {
                    credentials: "include",
                    cache: "no-store",
                });

                if (res.status === 401) {
                    window.location.href = "/login";
                    return;
                }

                if (!res.ok) {
                    setError("WG konnte nicht geladen werden.");
                    setLoading(false);
                    return;
                }

                const data: WGResponse = await res.json();
                setMembers(data.wg.members);
                setCurrentUserRole(data.wg.currentUserRole);

                const savedRooms = localStorage.getItem(`${STORAGE_PREFIX}${wgId}`);
                if (savedRooms) {
                    try {
                        const parsed = JSON.parse(savedRooms);
                        if (Array.isArray(parsed)) {
                            setRooms(parsed);
                        }
                    } catch {
                        // ignore broken localStorage
                    }
                }

                setLoading(false);
            } catch (err) {
                console.error("PUTZPLAN_LOAD_ERROR", err);
                setError("Putzplan konnte nicht geladen werden.");
                setLoading(false);
            }
        }

        loadWG();
    }, [wgId]);

    useEffect(() => {
        localStorage.setItem(`${STORAGE_PREFIX}${wgId}`, JSON.stringify(rooms));
    }, [rooms, wgId]);

    const schedule = useMemo(() => buildSchedule(members, rooms, weekCount), [members, rooms]);

    function handleRoomRename(index: number, value: string) {
        setRooms((prev) => prev.map((room, i) => (i === index ? value : room)));
    }

    function handleDeleteRoom(index: number) {
        setRooms((prev) => prev.filter((_, i) => i !== index));
    }

    function handleAddRoom() {
        const value = newRoomName.trim();
        if (!value) return;

        setRooms((prev) => [...prev, value]);
        setNewRoomName("");
    }

    if (loading) {
        return <div className="wg-loading">Lade Putzplan...</div>;
    }

    if (error) {
        return <div className="wg-loading wg-error">{error}</div>;
    }

    return (
        <div className="wg-stack">
            <div className="wg-card">
                <div className="wg-card-title-row">
                    <div>
                        <h2 className="wg-card-title">Aktueller Putzplan</h2>
                        <p className="wg-card-subtitle">
                            Rotationssystem für Zimmer, Pausen und nicht zugeteilte Räume.
                        </p>
                    </div>

                    {currentUserRole === "ADMIN" && (
                        <button
                            className="wg-card-action"
                            onClick={() => setIsEditorOpen((prev) => !prev)}
                        >
                            {isEditorOpen ? "Schließen" : "Edit"}
                        </button>
                    )}
                </div>

                <div className="putzplan-table">
                    <div className="putzplan-row putzplan-header">
                        <div className="putzplan-cell putzplan-week-cell">Wochen</div>
                        {members.map((member) => (
                            <div key={member.id} className="putzplan-cell putzplan-user-cell">
                                {member.name}
                            </div>
                        ))}
                    </div>

                    {schedule.map((week) => (
                        <div key={week.weekLabel} className="putzplan-row">
                            <div className="putzplan-cell putzplan-week-cell">
                                <div className="putzplan-week-title">{week.weekLabel}</div>
                                <div className="putzplan-week-range">{week.dateRange}</div>
                                {week.unassignedRooms.length > 0 && (
                                    <div className="putzplan-unassigned">
                                        Nicht zugeteilt: {week.unassignedRooms.join(", ")}
                                    </div>
                                )}
                            </div>

                            {week.assignments.map((assignment) => (
                                <div key={assignment.userId} className="putzplan-cell putzplan-room-cell">
                                    {assignment.room ? (
                                        <span>{assignment.room}</span>
                                    ) : (
                                        <span className="putzplan-rest">Pause</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>

                {rooms.length === 0 && (
                    <p className="wg-note">
                        Es sind aktuell keine Räume definiert. Öffne „Edit“, um Räume hinzuzufügen.
                    </p>
                )}

                {isEditorOpen && currentUserRole === "ADMIN" && (
                    <div className="putzplan-editor">
                        <h3 className="putzplan-editor-title">Räume bearbeiten</h3>

                        <div className="putzplan-editor-list">
                            {rooms.map((room, index) => (
                                <div key={`${room}-${index}`} className="putzplan-editor-row">
                                    <input
                                        className="wg-input"
                                        value={room}
                                        onChange={(e) => handleRoomRename(index, e.target.value)}
                                        placeholder="Raumname"
                                    />

                                    <button
                                        className="wg-btn-danger"
                                        onClick={() => handleDeleteRoom(index)}
                                    >
                                        Löschen
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="putzplan-editor-add">
                            <input
                                className="wg-input"
                                value={newRoomName}
                                onChange={(e) => setNewRoomName(e.target.value)}
                                placeholder="Neuen Raum hinzufügen"
                            />
                            <button className="wg-btn-primary" onClick={handleAddRoom}>
                                Hinzufügen
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}