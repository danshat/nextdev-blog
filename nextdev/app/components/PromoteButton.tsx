"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface PromoteButtonProps {
  userId: number;
  userRole: string;
  currentUserRole: string;
}

export default function PromoteButton({
  userId,
  userRole,
  currentUserRole,
}: PromoteButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmPromote, setShowConfirmPromote] = useState(false);
  const [showConfirmDemote, setShowConfirmDemote] = useState(false);

  // Only show button to admins, and only for users with "user" role
  if (currentUserRole !== "admin") {
    return null;
  }

  const handlePromote = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.stopPropagation();
    e?.preventDefault();
    setShowConfirmPromote(false);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`http://localhost:8000/users/${userId}/promote`, {
        method: "PUT",
        credentials: "include",
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.detail || "Ошибка при повышении прав");
      }
    } catch (err) {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  const handleDemote = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.stopPropagation();
    e?.preventDefault();
    setShowConfirmDemote(false);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`http://localhost:8000/users/${userId}/demote`, {
        method: "PUT",
        credentials: "include",
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.detail || "Ошибка при понижении прав");
      }
    } catch (err) {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 flex items-center gap-4">
      {userRole === "user" && (
        <div>
          {!showConfirmPromote ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setShowConfirmPromote(true);
              }}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-semibold transition"
              style={{ cursor: "pointer", pointerEvents: "auto", zIndex: 50 }}
            >
              {loading ? "Повышение..." : "Дать права модератора"}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void handlePromote(e);
                }}
                disabled={loading}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 text-white rounded-lg font-semibold transition"
              >
                {loading ? "Повышение..." : "Подтвердить"}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setShowConfirmPromote(false);
                }}
                disabled={loading}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-800 rounded-lg"
              >
                Отмена
              </button>
            </div>
          )}
        </div>
      )}

      {userRole === "moderator" && (
        <div>
          {!showConfirmDemote ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setShowConfirmDemote(true);
              }}
              disabled={loading}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-300 text-white rounded-lg font-semibold transition"
              style={{ cursor: "pointer", pointerEvents: "auto", zIndex: 50 }}
            >
              {loading ? "Понижение..." : "Понизить до пользователя"}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void handleDemote(e);
                }}
                disabled={loading}
                className="px-4 py-2 bg-yellow-700 hover:bg-yellow-800 disabled:bg-yellow-300 text-white rounded-lg font-semibold transition"
              >
                {loading ? "Понижение..." : "Подтвердить"}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setShowConfirmDemote(false);
                }}
                disabled={loading}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-800 rounded-lg"
              >
                Отмена
              </button>
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
