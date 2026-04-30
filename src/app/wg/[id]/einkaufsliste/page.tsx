"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import TrashIcon from "@/components/icons/TrashIcon";
import PencilIcon from "@/components/icons/PencilIcon";

type ShoppingItem = {
    id: string;
    name: string;
    status: "TO_BUY" | "INVENTORY";
    createdAt: string;
    updatedAt: string;
    createdBy: {
        id: string;
        name: string;
        email: string;
    };
};

type ShoppingListResponse = {
    items: ShoppingItem[];
    toBuyItems: ShoppingItem[];
    inventoryItems: ShoppingItem[];
};

type ColumnMode = "shopping" | "inventory";

export default function Einkaufsliste() {
    const params = useParams<{ id: string }>();
    const wgId = params.id;

    const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
    const [inventoryItems, setInventoryItems] = useState<ShoppingItem[]>([]);

    const [shoppingInput, setShoppingInput] = useState("");
    const [inventoryInput, setInventoryInput] = useState("");

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingMode, setEditingMode] = useState<ColumnMode | null>(null);
    const [editingValue, setEditingValue] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    async function loadItems() {
        try {
            const res = await fetch(`/api/wgs/${wgId}/shopping-list`, {
                credentials: "include",
                cache: "no-store",
            });

            if (res.status === 401) {
                window.location.href = "/login";
                return;
            }

            if (!res.ok) {
                setError("Einkaufsliste konnte nicht geladen werden.");
                setLoading(false);
                return;
            }

            const data: ShoppingListResponse = await res.json();
            setShoppingItems(data.toBuyItems ?? []);
            setInventoryItems(data.inventoryItems ?? []);
            setLoading(false);
        } catch (err) {
            console.error("LOAD_SHOPPING_LIST_ERROR", err);
            setError("Einkaufsliste konnte nicht geladen werden.");
            setLoading(false);
        }
    }

    useEffect(() => {
        if (!wgId) return;
        loadItems();
    }, [wgId]);

    function startEdit(item: ShoppingItem, mode: ColumnMode) {
        setMessage("");
        setEditingId(item.id);
        setEditingMode(mode);
        setEditingValue(item.name);
    }

    function cancelEdit() {
        setEditingId(null);
        setEditingMode(null);
        setEditingValue("");
    }

    async function addItem(mode: ColumnMode) {
        setMessage("");
        setError("");

        const value =
            mode === "shopping"
                ? shoppingInput.trim()
                : inventoryInput.trim();

        if (!value) {
            setMessage("Bitte einen Namen eingeben.");
            return;
        }

        try {
            setSaving(true);

            const res = await fetch(`/api/wgs/${wgId}/shopping-list`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    name: value,
                    status: mode === "shopping" ? "TO_BUY" : "INVENTORY",
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setMessage(data.error || "Artikel konnte nicht erstellt werden.");
                setSaving(false);
                return;
            }

            if (mode === "shopping") {
                setShoppingInput("");
            } else {
                setInventoryInput("");
            }

            await loadItems();
            setSaving(false);
        } catch (err) {
            console.error("ADD_SHOPPING_ITEM_ERROR", err);
            setMessage("Artikel konnte nicht erstellt werden.");
            setSaving(false);
        }
    }

    async function saveEdit() {
        setMessage("");
        setError("");

        if (!editingId || !editingMode) return;

        const trimmed = editingValue.trim();

        if (!trimmed) {
            setMessage("Bitte einen gültigen Namen eingeben.");
            return;
        }

        try {
            setSaving(true);

            const res = await fetch(`/api/wgs/${wgId}/shopping-list/${editingId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    name: trimmed,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setMessage(data.error || "Artikel konnte nicht bearbeitet werden.");
                setSaving(false);
                return;
            }

            cancelEdit();
            await loadItems();
            setSaving(false);
        } catch (err) {
            console.error("SAVE_EDIT_SHOPPING_ITEM_ERROR", err);
            setMessage("Artikel konnte nicht bearbeitet werden.");
            setSaving(false);
        }
    }

    async function moveToInventory(itemId: string) {
        setMessage("");
        setError("");

        try {
            const res = await fetch(`/api/wgs/${wgId}/shopping-list/${itemId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    status: "INVENTORY",
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setMessage(data.error || "Artikel konnte nicht verschoben werden.");
                return;
            }

            await loadItems();
            setMessage("Artikel wurde ins Inventar verschoben.");
        } catch (err) {
            console.error("MOVE_TO_INVENTORY_ERROR", err);
            setMessage("Artikel konnte nicht verschoben werden.");
        }
    }

    async function moveToShopping(itemId: string) {
        setMessage("");
        setError("");

        try {
            const res = await fetch(`/api/wgs/${wgId}/shopping-list/${itemId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    status: "TO_BUY",
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setMessage(data.error || "Artikel konnte nicht verschoben werden.");
                return;
            }

            await loadItems();
            setMessage("Artikel wurde zurück auf die Einkaufsliste gesetzt.");
        } catch (err) {
            console.error("MOVE_TO_SHOPPING_ERROR", err);
            setMessage("Artikel konnte nicht verschoben werden.");
        }
    }

    async function deleteItem(itemId: string, successMessage: string) {
        setMessage("");
        setError("");

        try {
            const res = await fetch(`/api/wgs/${wgId}/shopping-list/${itemId}`, {
                method: "DELETE",
                credentials: "include",
            });

            const data = await res.json();

            if (!res.ok) {
                setMessage(data.error || "Artikel konnte nicht gelöscht werden.");
                return;
            }

            await loadItems();
            setMessage(successMessage);
        } catch (err) {
            console.error("DELETE_SHOPPING_ITEM_ERROR", err);
            setMessage("Artikel konnte nicht gelöscht werden.");
        }
    }

    function renderList(items: ShoppingItem[], mode: ColumnMode) {
        if (items.length === 0) {
            return <p className="wg-note">Noch keine Einträge vorhanden.</p>;
        }

        return (
            <div className="budget-list">
                {items.map((item) => {
                    const isEditing =
                        editingId === item.id && editingMode === mode;

                    return (
                        <div
                            key={item.id}
                            className="budget-balance-item"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "12px",
                            }}
                        >
                            {isEditing ? (
                                <>
                                    <input
                                        className="wg-input"
                                        value={editingValue}
                                        onChange={(e) => setEditingValue(e.target.value)}
                                        style={{ marginBottom: 0 }}
                                        disabled={saving}
                                    />

                                    <div
                                        style={{
                                            display: "flex",
                                            gap: "8px",
                                            flexShrink: 0,
                                        }}
                                    >
                                        <button className="wg-btn-primary" onClick={saveEdit} disabled={saving}>
                                            Speichern
                                        </button>
                                        <button className="wg-btn-secondary" onClick={cancelEdit} disabled={saving}>
                                            Abbrechen
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className="budget-balance-text" style={{ margin: 0 }}>
                                        {item.name}
                                    </p>

                                    <div
                                        style={{
                                            display: "flex",
                                            gap: "8px",
                                            flexShrink: 0,
                                        }}
                                    >
                                        <button
                                            aria-label="Bearbeiten"
                                            className="wg-btn-secondary"
                                            onClick={() => startEdit(item, mode)}
                                        >
                                            <PencilIcon />
                                        </button>

                                        {mode === "shopping" ? (
                                            <>
                                                <button
                                                    className="wg-btn-primary"
                                                    onClick={() => moveToInventory(item.id)}
                                                >
                                                    Gekauft
                                                </button>
                                                <button
                                                    aria-label="Löschen"
                                                    className="wg-btn-danger"
                                                    onClick={() =>
                                                        deleteItem(item.id, "Artikel wurde aus der Einkaufsliste entfernt.")
                                                    }
                                                >
                                                      <TrashIcon  />

                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    className="wg-btn-secondary"
                                                    onClick={() => moveToShopping(item.id)}
                                                >
                                                    Neu kaufen
                                                </button>
                                                <button
                                                    className="wg-btn-danger"
                                                    onClick={() =>
                                                        deleteItem(item.id, "Artikel wurde aus dem Inventar entfernt.")
                                                    }
                                                >
                                                    Verbraucht
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    }

    if (loading) {
        return <div className="wg-loading">Lade Einkaufsliste...</div>;
    }

    if (error) {
        return <div className="wg-loading wg-error">{error}</div>;
    }

    return (
        <div className="wg-stack">
            <div className="wg-card">
                {message && <p className="wg-success">{message}</p>}

                <div className="budget-grid" style={{ alignItems: "start" }}>
                    <div className="budget-column">
                        <div className="budget-column-header">
                            <h3 className="budget-column-title">Zu kaufen</h3>
                            <button
                                className="wg-card-action"
                                onClick={() => addItem("shopping")}
                                disabled={saving}
                            >
                                Hinzufügen
                            </button>
                        </div>

                        <div style={{ marginBottom: "16px" }}>
                            <input
                                className="wg-input"
                                placeholder="Artikel eingeben"
                                value={shoppingInput}
                                onChange={(e) => setShoppingInput(e.target.value)}
                                disabled={saving}
                            />
                        </div>

                        {renderList(shoppingItems, "shopping")}
                    </div>

                    <div className="budget-column">
                        <div className="budget-column-header">
                            <h3 className="budget-column-title">Inventar</h3>
                            <button
                                className="wg-card-action"
                                onClick={() => addItem("inventory")}
                                disabled={saving}
                            >
                                Hinzufügen
                            </button>
                        </div>

                        <div style={{ marginBottom: "16px" }}>
                            <input
                                className="wg-input"
                                placeholder="Inventar-Artikel eingeben"
                                value={inventoryInput}
                                onChange={(e) => setInventoryInput(e.target.value)}
                                disabled={saving}
                            />
                        </div>

                        {renderList(inventoryItems, "inventory")}
                    </div>
                </div>
            </div>
        </div>
    );
}