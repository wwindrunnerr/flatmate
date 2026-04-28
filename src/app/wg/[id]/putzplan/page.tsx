"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type WGMember = {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "MEMBER";
};

type WeekOverride = {
    weekStart: string;
    assignments: Record<string, string[]>;
    unassignedRooms: string[];
    expiresAt: string;
};

type PutzplanApiResponse = {
    members: WGMember[];
    rooms: string[];
    weekOverrides: WeekOverride[];
};

type Assignment = {
    userId: string;
    userName: string;
    rooms: string[];
};

type WeekPlan = {
    weekIndex: number;
    weekType: "previous" | "current" | "next" | "after-next";
    weekLabel: string;
    weekStartIso: string;
    dateRange: string;
    assignments: Assignment[];
    unassignedRooms: string[];
};

type WeekOverridesMap = Record<string, WeekOverride>;

type DragRoomState =
    | {
    roomName: string;
    sourceType: "user";
    sourceUserId: string;
}
    | {
    roomName: string;
    sourceType: "unassigned";
}
    | null;

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

function getWeekLabelByOffset(offset: number) {
    switch (offset) {
        case -1:
            return "Letzte Woche";
        case 0:
            return "Diese Woche";
        case 1:
            return "Nächste Woche";
        case 2:
            return "Übernächste Woche";
        default:
            return `Woche ${offset}`;
    }
}

function getWeekTypeByOffset(
    offset: number
): "previous" | "current" | "next" | "after-next" {
    switch (offset) {
        case -1:
            return "previous";
        case 0:
            return "current";
        case 1:
            return "next";
        default:
            return "after-next";
    }
}

function buildBaseSchedule(members: WGMember[], rooms: string[]): WeekPlan[] {
    if (members.length === 0) return [];

    const cleanedRooms = rooms.map((r) => r.trim()).filter(Boolean);
    const currentMonday = getMonday(new Date());
    const weekOffsets = [-1, 0, 1, 2];

    return weekOffsets.map((offset, visualIndex) => {
        const rotatedRooms = rotateArray(cleanedRooms, offset);
        const weekStart = addDays(currentMonday, offset * 7);
        const weekStartIso = weekStart.toISOString();

        const assignments: Assignment[] = members.map((member) => ({
            userId: member.id,
            userName: member.name,
            rooms: [],
        }));

        rotatedRooms.forEach((room, roomIndex) => {
            const memberIndex = roomIndex % members.length;
            assignments[memberIndex].rooms.push(room);
        });

        return {
            weekIndex: visualIndex,
            weekType: getWeekTypeByOffset(offset),
            weekLabel: getWeekLabelByOffset(offset),
            weekStartIso,
            dateRange: formatWeekRange(weekStart),
            assignments,
            unassignedRooms: [],
        };
    });
}

function applyWeekOverrides(
    baseSchedule: WeekPlan[],
    overrides: WeekOverridesMap
): WeekPlan[] {
    return baseSchedule.map((week) => {
        const override = overrides[week.weekStartIso];
        if (!override) return week;

        return {
            ...week,
            assignments: week.assignments.map((assignment) => ({
                ...assignment,
                rooms:
                    override.assignments[assignment.userId] !== undefined
                        ? override.assignments[assignment.userId]
                        : assignment.rooms,
            })),
            unassignedRooms: override.unassignedRooms ?? [],
        };
    });
}

export default function PutzplanPage() {
    const params = useParams<{ id: string }>();
    const wgId = params.id;

    const [members, setMembers] = useState<WGMember[]>([]);
    const [rooms, setRooms] = useState<string[]>([]);
    const [roomDrafts, setRoomDrafts] = useState<Record<number, string>>({});
    const [newRoomName, setNewRoomName] = useState("");

    const [weekOverrides, setWeekOverrides] = useState<WeekOverridesMap>({});
    const [selectedWeekStartIso, setSelectedWeekStartIso] = useState<string | null>(null);

    const [modalAssignments, setModalAssignments] = useState<Record<string, string[]>>({});
    const [modalUnassignedRooms, setModalUnassignedRooms] = useState<string[]>([]);
    const [draggedRoom, setDraggedRoom] = useState<DragRoomState>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [saveMsg, setSaveMsg] = useState("");

    useEffect(() => {
        async function loadPutzplan() {
            try {
                const res = await fetch(`/api/wgs/${wgId}/putzplan`, {
                    credentials: "include",
                    cache: "no-store",
                });

                if (res.status === 401) {
                    window.location.href = "/login";
                    return;
                }

                if (!res.ok) {
                    setError("Putzplan konnte nicht geladen werden.");
                    setLoading(false);
                    return;
                }

                const data: PutzplanApiResponse = await res.json();
                setMembers(data.members);
                setRooms(data.rooms);
                setRoomDrafts(
                    Object.fromEntries(data.rooms.map((room, index) => [index, room]))
                );

                const overrideMap: WeekOverridesMap = {};
                for (const override of data.weekOverrides) {
                    overrideMap[override.weekStart] = override;
                }
                setWeekOverrides(overrideMap);

                setLoading(false);
            } catch (err) {
                console.error("PUTZPLAN_LOAD_ERROR", err);
                setError("Putzplan konnte nicht geladen werden.");
                setLoading(false);
            }
        }

        loadPutzplan();
    }, [wgId]);

    const schedule = useMemo(() => {
        const base = buildBaseSchedule(members, rooms);
        return applyWeekOverrides(base, weekOverrides);
    }, [members, rooms, weekOverrides]);

    const selectedWeek =
        selectedWeekStartIso !== null
            ? schedule.find((week) => week.weekStartIso === selectedWeekStartIso) ?? null
            : null;

    function openWeekModal(week: WeekPlan) {
        setSelectedWeekStartIso(week.weekStartIso);

        const assignmentMap: Record<string, string[]> = {};
        for (const assignment of week.assignments) {
            assignmentMap[assignment.userId] = [...assignment.rooms];
        }

        setModalAssignments(assignmentMap);
        setModalUnassignedRooms([...week.unassignedRooms]);
        setDraggedRoom(null);
        setSaveMsg("");
    }

    function closeWeekModal() {
        setSelectedWeekStartIso(null);
        setModalAssignments({});
        setModalUnassignedRooms([]);
        setDraggedRoom(null);
        setSaveMsg("");
    }

    async function saveWeekOverride() {
        if (!selectedWeek) return;

        try {
            const res = await fetch(`/api/wgs/${wgId}/putzplan`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    weekOverride: {
                        weekStart: selectedWeek.weekStartIso,
                        assignments: modalAssignments,
                        unassignedRooms: modalUnassignedRooms.map((r) => r.trim()).filter(Boolean),
                    },
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setSaveMsg(data.error || "Woche konnte nicht gespeichert werden.");
                return;
            }

            const override: WeekOverride = {
                weekStart: selectedWeek.weekStartIso,
                assignments: modalAssignments,
                unassignedRooms: modalUnassignedRooms.map((r) => r.trim()).filter(Boolean),
                expiresAt: "",
            };

            setWeekOverrides((prev) => ({
                ...prev,
                [selectedWeek.weekStartIso]: override,
            }));

            closeWeekModal();
        } catch (err) {
            console.error("PUTZPLAN_WEEK_SAVE_ERROR", err);
            setSaveMsg("Woche konnte nicht gespeichert werden.");
        }
    }

    async function persistRooms(nextRooms: string[]) {
        try {
            const cleaned = nextRooms.map((r) => r.trim()).filter(Boolean);

            const res = await fetch(`/api/wgs/${wgId}/putzplan`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    rooms: cleaned,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setSaveMsg(data.error || "Räume konnten nicht gespeichert werden.");
                return false;
            }

            setRooms(data.rooms);
            setRoomDrafts(
                Object.fromEntries(data.rooms.map((room: string, index: number) => [index, room]))
            );
            setSaveMsg("Basisräume gespeichert.");
            return true;
        } catch (err) {
            console.error("PUTZPLAN_ROOMS_SAVE_ERROR", err);
            setSaveMsg("Räume konnten nicht gespeichert werden.");
            return false;
        }
    }

    function handleRoomDraftChange(index: number, value: string) {
        setRoomDrafts((prev) => ({
            ...prev,
            [index]: value,
        }));
    }

    async function handleRoomUpdate(index: number) {
        const draftValue = (roomDrafts[index] ?? rooms[index] ?? "").trim();
        if (!draftValue) return;

        const previousRooms = rooms;
        const nextRooms = rooms.map((room, i) => (i === index ? draftValue : room));

        setRooms(nextRooms);

        const ok = await persistRooms(nextRooms);

        if (!ok) {
            setRooms(previousRooms);
            setRoomDrafts(
                Object.fromEntries(previousRooms.map((room, i) => [i, room]))
            );
            return;
        }

        setRoomDrafts(
            Object.fromEntries(nextRooms.map((room, i) => [i, room]))
        );
    }

    async function handleDeleteRoom(index: number) {
        const previousRooms = rooms;
        const nextRooms = rooms.filter((_, i) => i !== index);

        setRooms(nextRooms);

        const ok = await persistRooms(nextRooms);

        if (!ok) {
            setRooms(previousRooms);
            setRoomDrafts(
                Object.fromEntries(previousRooms.map((room, i) => [i, room]))
            );
            return;
        }

        setRoomDrafts(
            Object.fromEntries(nextRooms.map((room, i) => [i, room]))
        );
    }

    async function handleAddRoom() {
        const value = newRoomName.trim();
        if (!value) return;

        const previousRooms = rooms;
        const nextRooms = [...rooms, value];

        setRooms(nextRooms);
        setNewRoomName("");

        const ok = await persistRooms(nextRooms);

        if (!ok) {
            setRooms(previousRooms);
            setRoomDrafts(
                Object.fromEntries(previousRooms.map((room, i) => [i, room]))
            );
            setNewRoomName(value);
            return;
        }

        setRoomDrafts(
            Object.fromEntries(nextRooms.map((room, i) => [i, room]))
        );
    }

    function handleDragStartFromUser(userId: string, roomName: string) {
        setDraggedRoom({
            roomName,
            sourceType: "user",
            sourceUserId: userId,
        });
    }

    function handleDragStartFromUnassigned(roomName: string) {
        setDraggedRoom({
            roomName,
            sourceType: "unassigned",
        });
    }

    function removeDraggedRoomFromSource() {
        if (!draggedRoom) return;

        if (draggedRoom.sourceType === "user") {
            setModalAssignments((prev) => ({
                ...prev,
                [draggedRoom.sourceUserId]: (prev[draggedRoom.sourceUserId] ?? []).filter(
                    (room) => room !== draggedRoom.roomName
                ),
            }));
        } else {
            setModalUnassignedRooms((prev) =>
                prev.filter((room) => room !== draggedRoom.roomName)
            );
        }
    }

    function dropRoomToUser(targetUserId: string) {
        if (!draggedRoom) return;
        if (draggedRoom.sourceType === "user" && draggedRoom.sourceUserId === targetUserId) {
            setDraggedRoom(null);
            return;
        }

        removeDraggedRoomFromSource();

        setModalAssignments((prev) => ({
            ...prev,
            [targetUserId]: [...(prev[targetUserId] ?? []), draggedRoom.roomName],
        }));

        setDraggedRoom(null);
    }

    function dropRoomToUnassigned() {
        if (!draggedRoom) return;

        removeDraggedRoomFromSource();
        setModalUnassignedRooms((prev) => [...prev, draggedRoom.roomName]);
        setDraggedRoom(null);
    }

    function updateAssignedRoomName(userId: string, roomIndex: number, value: string) {
        setModalAssignments((prev) => ({
            ...prev,
            [userId]: (prev[userId] ?? []).map((room, index) =>
                index === roomIndex ? value : room
            ),
        }));
    }

    function updateUnassignedRoomName(roomIndex: number, value: string) {
        setModalUnassignedRooms((prev) =>
            prev.map((room, index) => (index === roomIndex ? value : room))
        );
    }

    function deleteAssignedRoom(userId: string, roomIndex: number) {
        setModalAssignments((prev) => ({
            ...prev,
            [userId]: (prev[userId] ?? []).filter((_, index) => index !== roomIndex),
        }));
    }

    function deleteUnassignedRoom(roomIndex: number) {
        setModalUnassignedRooms((prev) => prev.filter((_, index) => index !== roomIndex));
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
                            Letzte, aktuelle und kommende Wochen im Rotationssystem.
                        </p>
                    </div>
                </div>

                <div className="putzplan-table">
                    <div className="putzplan-row putzplan-header">
                        <div className="putzplan-cell putzplan-week-cell">Kalenderwochen</div>
                        {members.map((member) => (
                            <div key={member.id} className="putzplan-cell putzplan-user-cell">
                                {member.name}
                            </div>
                        ))}
                    </div>

                    {schedule.map((week) => (
                        <div key={week.weekStartIso} className="putzplan-row">
                            <div
                                className={`putzplan-cell putzplan-week-cell ${
                                    week.weekType === "current" ? "putzplan-current-week" : ""
                                }`}
                            >
                                <button
                                    className="putzplan-week-edit-btn"
                                    onClick={() => openWeekModal(week)}
                                >
                                    Edit
                                </button>

                                <div
                                    className={`putzplan-week-title ${
                                        week.weekType === "current" ? "putzplan-week-title-current" : ""
                                    }`}
                                >
                                    {week.weekLabel}
                                </div>

                                <div className="putzplan-week-range">{week.dateRange}</div>

                                {week.unassignedRooms.length > 0 && (
                                    <div className="putzplan-unassigned">
                                        Nicht zugeteilt: {week.unassignedRooms.join(", ")}
                                    </div>
                                )}
                            </div>

                            {week.assignments.map((assignment) => (
                                <div key={assignment.userId} className="putzplan-cell putzplan-room-cell">
                                    {assignment.rooms.length > 0 ? (
                                        <span>{assignment.rooms.join(", ")}</span>
                                    ) : (
                                        <span className="putzplan-rest">Pause</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>

                <div className="putzplan-base-editor">
                    <h3 className="putzplan-editor-title">Basisräume verwalten</h3>

                    <div className="putzplan-editor-list">
                        {rooms.map((room, index) => {
                            const draftValue = roomDrafts[index] ?? room;
                            const canUpdate =
                                draftValue.trim() !== "" && draftValue.trim() !== room;

                            return (
                                <div key={index} className="putzplan-editor-row">
                                    <div className="putzplan-editor-label">Raum {index + 1}</div>

                                    <div className="putzplan-editor-controls">
                                        <input
                                            className="wg-input"
                                            value={draftValue}
                                            onChange={(e) => handleRoomDraftChange(index, e.target.value)}
                                            placeholder="Raumname"
                                        />

                                        {canUpdate && (
                                            <button
                                                className="wg-btn-secondary"
                                                onClick={() => handleRoomUpdate(index)}
                                            >
                                                Update
                                            </button>
                                        )}

                                        <button
                                            className="wg-btn-danger"
                                            onClick={() => handleDeleteRoom(index)}
                                        >
                                            Löschen
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="putzplan-editor-add">
                        <input
                            className="wg-input"
                            value={newRoomName}
                            onChange={(e) => setNewRoomName(e.target.value)}
                            placeholder="Neuen Basisraum hinzufügen"
                        />
                        <button className="wg-btn-primary" onClick={handleAddRoom}>
                            Hinzufügen
                        </button>
                    </div>
                </div>

                {saveMsg && (
                    <p className={saveMsg.includes("gespeichert") ? "wg-success" : "wg-error"}>
                        {saveMsg}
                    </p>
                )}
            </div>

            {isModalOpen(selectedWeekStartIso) && selectedWeek && (
                <div className="putzplan-modal-overlay" onClick={closeWeekModal}>
                    <div className="putzplan-modal putzplan-modal-wide" onClick={(e) => e.stopPropagation()}>
                        <div className="wg-card-title-row">
                            <div>
                                <h3 className="putzplan-editor-title">
                                    {selectedWeek.weekLabel} bearbeiten
                                </h3>
                                <p className="wg-card-subtitle">{selectedWeek.dateRange}</p>
                            </div>
                        </div>

                        <div className="putzplan-dnd-layout">
                            <div className="putzplan-dnd-column">
                                <h4 className="putzplan-dnd-column-title">Mitglieder</h4>

                                <div className="putzplan-user-dropzones">
                                    {members.map((member) => (
                                        <div
                                            key={member.id}
                                            className="putzplan-user-dropzone"
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={() => dropRoomToUser(member.id)}
                                        >
                                            <div className="putzplan-user-dropzone-header">
                                                <span>{member.name}</span>
                                            </div>

                                            <div className="putzplan-room-chip-list">
                                                {(modalAssignments[member.id] ?? []).length === 0 ? (
                                                    <p className="wg-note">Keine Räume</p>
                                                ) : (
                                                    (modalAssignments[member.id] ?? []).map((room, roomIndex) => (
                                                        <div
                                                            key={`${member.id}-${roomIndex}-${room}`}
                                                            className="putzplan-room-chip"
                                                            draggable
                                                            onDragStart={() =>
                                                                handleDragStartFromUser(member.id, room)
                                                            }
                                                        >
                                                            <input
                                                                className="wg-input putzplan-room-chip-input"
                                                                value={room}
                                                                onChange={(e) =>
                                                                    updateAssignedRoomName(
                                                                        member.id,
                                                                        roomIndex,
                                                                        e.target.value
                                                                    )
                                                                }
                                                            />
                                                            <button
                                                                className="wg-btn-danger"
                                                                onClick={() =>
                                                                    deleteAssignedRoom(member.id, roomIndex)
                                                                }
                                                            >
                                                                Löschen
                                                            </button>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="putzplan-dnd-column">
                                <h4 className="putzplan-dnd-column-title">Nicht zugeteilt</h4>

                                <div
                                    className="putzplan-unassigned-dropzone"
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={dropRoomToUnassigned}
                                >
                                    <div className="putzplan-room-chip-list">
                                        {modalUnassignedRooms.length === 0 ? (
                                            <p className="wg-note">Keine nicht zugeteilten Räume</p>
                                        ) : (
                                            modalUnassignedRooms.map((room, roomIndex) => (
                                                <div
                                                    key={`unassigned-${roomIndex}-${room}`}
                                                    className="putzplan-room-chip"
                                                    draggable
                                                    onDragStart={() => handleDragStartFromUnassigned(room)}
                                                >
                                                    <input
                                                        className="wg-input putzplan-room-chip-input"
                                                        value={room}
                                                        onChange={(e) =>
                                                            updateUnassignedRoomName(
                                                                roomIndex,
                                                                e.target.value
                                                            )
                                                        }
                                                    />
                                                    <button
                                                        className="wg-btn-danger"
                                                        onClick={() => deleteUnassignedRoom(roomIndex)}
                                                    >
                                                        Löschen
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {saveMsg && (
                            <p className={saveMsg.includes("gespeichert") ? "wg-success" : "wg-error"}>
                                {saveMsg}
                            </p>
                        )}

                        <div className="wg-actions-row">
                            <button className="wg-btn-secondary" onClick={closeWeekModal}>
                                Abbrechen
                            </button>
                            <button className="wg-btn-primary" onClick={saveWeekOverride}>
                                Woche speichern
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function isModalOpen(selectedWeekStartIso: string | null) {
    return selectedWeekStartIso !== null;
}