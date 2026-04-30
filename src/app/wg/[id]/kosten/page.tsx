"use client";

import { useEffect, useState } from "react";
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

type Expense = {
    id: string;
    description: string;
    amountCents: number;
    amount: number;
    createdAt: string;
    paidBy: {
        id: string;
        name: string;
        email: string;
    };
    participantUserIds: string[];
    participantNames: string[];
};

type CurrentUserSummary = {
    otherUserId: string;
    otherUserName: string;
    direction: "you_owe" | "owes_you" | "settled";
    amountCents: number;
    amount: number;
};

type ExpensesResponse = {
    expenses: Expense[];
    pairwiseBalances: Array<{
        fromUserId: string;
        fromUserName: string;
        toUserId: string;
        toUserName: string;
        amountCents: number;
        amount: number;
    }>;
    currentUserSummary: CurrentUserSummary[];
};

type SessionUser = {
    id: string;
    email: string;
    name: string;
};

type ModalMode = "create" | "edit";

function formatEuro(amount: number) {
    return new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR",
    }).format(amount);
}

function formatDateTime(iso: string) {
    return new Intl.DateTimeFormat("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(iso));
}

export default function KostenPage() {
    const params = useParams<{ id: string }>();
    const wgId = params.id;

    const [members, setMembers] = useState<WGMember[]>([]);
    const [currentUserRole, setCurrentUserRole] = useState<"ADMIN" | "MEMBER" | null>(null);
    const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);

    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [summary, setSummary] = useState<CurrentUserSummary[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<ModalMode>("create");
    const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const [description, setDescription] = useState("");
    const [amountInput, setAmountInput] = useState("");
    const [participantUserIds, setParticipantUserIds] = useState<string[]>([]);
    const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            try {
                const [meRes, wgRes, expensesRes] = await Promise.all([
                    fetch("/api/me", {
                        credentials: "include",
                        cache: "no-store",
                    }),
                    fetch(`/api/wgs/${wgId}`, {
                        credentials: "include",
                        cache: "no-store",
                    }),
                    fetch(`/api/wgs/${wgId}/expenses`, {
                        credentials: "include",
                        cache: "no-store",
                    }),
                ]);

                if (meRes.status === 401 || wgRes.status === 401 || expensesRes.status === 401) {
                    window.location.href = "/login";
                    return;
                }

                if (!meRes.ok) {
                    setError("Benutzerdaten konnten nicht geladen werden.");
                    setLoading(false);
                    return;
                }

                if (!wgRes.ok) {
                    setError("WG-Daten konnten nicht geladen werden.");
                    setLoading(false);
                    return;
                }

                if (!expensesRes.ok) {
                    setError("Budget-Daten konnten nicht geladen werden.");
                    setLoading(false);
                    return;
                }

                const meData = await meRes.json();
                const wgData: WGResponse = await wgRes.json();
                const expensesData: ExpensesResponse = await expensesRes.json();

                setCurrentUser(meData.user ?? null);
                setMembers(wgData.wg.members);
                setCurrentUserRole(wgData.wg.currentUserRole);
                setExpenses(expensesData.expenses);
                setSummary(expensesData.currentUserSummary);

                if (wgData.wg.members.length > 0) {
                    setParticipantUserIds(wgData.wg.members.map((member) => member.id));
                }

                setLoading(false);
            } catch (err) {
                console.error("KOSTEN_LOAD_ERROR", err);
                setError("Budget konnte nicht geladen werden.");
                setLoading(false);
            }
        }

        loadData();
    }, [wgId]);

    function resetForm() {
        setDescription("");
        setAmountInput("");
        setEditingExpenseId(null);
        setModalMode("create");
        setParticipantUserIds(members.map((member) => member.id));
    }

    function openCreateModal() {
        resetForm();
        setMessage("");
        setIsModalOpen(true);
    }

    function openEditModal(expense: Expense) {
        setModalMode("edit");
        setEditingExpenseId(expense.id);
        setDescription(expense.description);
        setAmountInput(String((expense.amountCents / 100).toFixed(2)).replace(".", ","));
        setParticipantUserIds(expense.participantUserIds);
        setMessage("");
        setIsModalOpen(true);
    }

    function closeModal() {
        setIsModalOpen(false);
        setMessage("");
        setEditingExpenseId(null);
    }

    function toggleParticipant(userId: string) {
        setParticipantUserIds((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId]
        );
    }

    function selectAllParticipants() {
        setParticipantUserIds(members.map((member) => member.id));
    }

    function selectAllExceptMe() {
        if (!currentUser?.id) return;
        setParticipantUserIds(
            members
                .filter((member) => member.id !== currentUser.id)
                .map((member) => member.id)
        );
    }

    function toggleExpandedExpense(expenseId: string) {
        setExpandedExpenseId((prev) => (prev === expenseId ? null : expenseId));
    }

    async function reloadExpensesOnly() {
        const expensesRes = await fetch(`/api/wgs/${wgId}/expenses`, {
            credentials: "include",
            cache: "no-store",
        });

        if (!expensesRes.ok) {
            throw new Error("Expenses reload failed");
        }

        const expensesData: ExpensesResponse = await expensesRes.json();
        setExpenses(expensesData.expenses);
        setSummary(expensesData.currentUserSummary);
    }

    function validateForm() {
        const normalizedAmount = amountInput.replace(",", ".").trim();
        const amountNumber = Number(normalizedAmount);
        const amountCents = Math.round(amountNumber * 100);

        if (!description.trim()) {
            return { ok: false as const, error: "Bitte Beschreibung eingeben." };
        }

        if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
            return { ok: false as const, error: "Bitte gültigen Betrag eingeben." };
        }

        if (participantUserIds.length === 0) {
            return {
                ok: false as const,
                error: "Bitte mindestens eine Person zum Teilen auswählen.",
            };
        }

        return {
            ok: true as const,
            amountCents,
        };
    }

    async function handleSaveExpense() {
        setMessage("");
        const validation = validateForm();

        if (!validation.ok) {
            setMessage(validation.error);
            return;
        }

        try {
            setSaving(true);

            const url =
                modalMode === "create"
                    ? `/api/wgs/${wgId}/expenses`
                    : `/api/wgs/${wgId}/expenses/${editingExpenseId}`;

            const method = modalMode === "create" ? "POST" : "PATCH";

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    description: description.trim(),
                    amountCents: validation.amountCents,
                    participantUserIds,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setMessage(data.error || "Ausgabe konnte nicht gespeichert werden.");
                setSaving(false);
                return;
            }

            await reloadExpensesOnly();
            setSaving(false);
            closeModal();
        } catch (err) {
            console.error("SAVE_EXPENSE_UI_ERROR", err);
            setMessage("Ausgabe konnte nicht gespeichert werden.");
            setSaving(false);
        }
    }

    async function handleDeleteExpense(expenseId: string) {
        const confirmed = window.confirm("Möchtest du diese Ausgabe wirklich löschen?");
        if (!confirmed) return;

        try {
            const res = await fetch(`/api/wgs/${wgId}/expenses/${expenseId}`, {
                method: "DELETE",
                credentials: "include",
            });

            const data = await res.json();

            if (!res.ok) {
                setMessage(data.error || "Ausgabe konnte nicht gelöscht werden.");
                return;
            }

            await reloadExpensesOnly();
        } catch (err) {
            console.error("DELETE_EXPENSE_UI_ERROR", err);
            setMessage("Ausgabe konnte nicht gelöscht werden.");
        }
    }

    function canManageExpense(expense: Expense) {
        return expense.paidBy.id === currentUser?.id || currentUserRole === "ADMIN";
    }

    if (loading) {
        return <div className="wg-loading">Lade Budget...</div>;
    }

    if (error) {
        return <div className="wg-loading wg-error">{error}</div>;
    }

    return (
        <div className="wg-stack">
            <div className="wg-card">
                <div className="wg-card-title-row budget-page-header">

                    <button className="wg-card-action" onClick={openCreateModal}>
                        Ausgabe hinzufügen
                    </button>
                </div>

                {message && (
                    <p className={message.includes("gespeichert") ? "wg-success" : "wg-error"}>
                        {message}
                    </p>
                )}

                <div className="budget-grid">
                    <div className="budget-column">
                        <div className="budget-column-header">
                            <h3 className="budget-column-title">Ausgaben</h3>
                        </div>

                        {expenses.length === 0 ? (
                            <p className="budget-empty">Noch keine Ausgaben vorhanden.</p>
                        ) : (
                            <div className="budget-list">
                                {expenses.map((expense) => (
                                    <div
                                        key={expense.id}
                                        className={`budget-item budget-item-collapsible ${
                                            expandedExpenseId === expense.id
                                                ? "budget-item-expanded"
                                                : ""
                                        }`}
                                        onClick={() => toggleExpandedExpense(expense.id)}
                                    >
                                        <div className="budget-item-top">
                                            <p className="budget-item-title">{expense.description}</p>
                                            <div className="budget-item-amount">
                                                {formatEuro(expense.amount)}
                                            </div>
                                        </div>

                                        {expandedExpenseId === expense.id && (
                                            <div className="budget-item-details">
                                                <p className="budget-item-meta">
                                                    Bezahlt von {expense.paidBy.name}
                                                </p>
                                                <p className="budget-item-meta">
                                                    Geteilt zwischen:{" "}
                                                    {expense.participantNames.join(", ")}
                                                </p>
                                                <p className="budget-item-date">
                                                    {formatDateTime(expense.createdAt)}
                                                </p>

                                                {canManageExpense(expense) && (
                                                    <div
                                                        className="budget-item-actions"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <button
                                                            className="wg-btn-secondary"
                                                            onClick={() => openEditModal(expense)}
                                                        >
                                                            Bearbeiten
                                                        </button>
                                                        <button
                                                            className="wg-btn-danger"
                                                            onClick={() => handleDeleteExpense(expense.id)}
                                                        >
                                                            Löschen
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="budget-column">
                        <div className="budget-column-header">
                            <h3 className="budget-column-title">Schulden</h3>
                        </div>

                        {summary.length === 0 ? (
                            <p className="budget-empty">
                                Aktuell gibt es keine offenen Schulden.
                            </p>
                        ) : (
                            <div className="budget-list">
                                {summary.map((item) => (
                                    <div key={item.otherUserId} className="budget-balance-item">

                                        {item.direction === "you_owe" && (
                                            <p className="budget-balance-text">
                                                Du schuldest <b>{item.otherUserName}{" "}</b>
                                                {formatEuro(item.amount)}
                                            </p>
                                        )}

                                        {item.direction === "owes_you" && (
                                            <p className="budget-balance-text">
                                                Du bekommst von <b>{item.otherUserName}{" "}</b>
                                                {formatEuro(item.amount)}
                                            </p>
                                        )}

                                        {item.direction === "settled" && (
                                            <p className="budget-balance-text">
                                                Du bist quitt mit <b>{item.otherUserName}</b>
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className="popup-overlay" onClick={closeModal}>
                    <div className="popup-modal" onClick={(e) => e.stopPropagation()}>

                        <div className="budget-form budget-form-compact">
                            <input
                                className="wg-input"
                                placeholder="Beschreibung, z. B. Milch"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                disabled={saving}
                            />

                            <input
                                className="wg-input"
                                placeholder="0,00"
                                value={amountInput}
                                onChange={(e) => {
                                    const value = e.target.value
                                        .replace(/[^\d.,]/g, "")
                                        .replace(".", ",");
                                    setAmountInput(value);
                                }}
                                inputMode="decimal"
                                enterKeyHint="done"
                                disabled={saving}
                            />

                            <div className="budget-split-box">
                                <h4 className="budget-split-title">Geteilt zwischen</h4>

                                <div className="budget-split-actions budget-split-actions-below">
                                    <button
                                        type="button"
                                        className="wg-btn-secondary"
                                        onClick={selectAllParticipants}
                                        disabled={saving}
                                    >
                                        Alle
                                    </button>
                                    <button
                                        type="button"
                                        className="wg-btn-secondary"
                                        onClick={selectAllExceptMe}
                                        disabled={saving}
                                    >
                                        Alle außer mich
                                    </button>
                                </div>

                                <div className="budget-checkbox-list">
                                    {members.map((member) => (
                                        <label key={member.id} className="budget-checkbox-item">
                                            <input
                                                type="checkbox"
                                                checked={participantUserIds.includes(member.id)}
                                                onChange={() => toggleParticipant(member.id)}
                                                disabled={saving}
                                            />
                                            <span>{member.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {message && (
                                <p
                                    className={
                                        message.includes("gespeichert")
                                            ? "wg-success"
                                            : "wg-error"
                                    }
                                >
                                    {message}
                                </p>
                            )}

                            <div className="budget-modal-footer">
                                <button className="wg-btn-secondary" onClick={closeModal} disabled={saving}>
                                    Abbrechen
                                </button>

                                <button
                                    className="wg-btn-primary"
                                    onClick={handleSaveExpense}
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Wird gespeichert..."
                                        : modalMode === "create"
                                            ? "Ausgabe speichern"
                                            : "Änderungen speichern"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}