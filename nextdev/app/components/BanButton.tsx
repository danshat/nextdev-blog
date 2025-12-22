"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface BanButtonProps {
  userId: number;
  isBanned: boolean;
  currentUserRole: string;
}

export default function BanButton({
  userId,
  isBanned,
  currentUserRole,
}: BanButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmBan, setShowConfirmBan] = useState(false);
  const [showConfirmUnban, setShowConfirmUnban] = useState(false);

  // Only show button to admins and moderators
  if (currentUserRole !== "admin" && currentUserRole !== "moderator") {
    return null;
  }

  const handleBan = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.stopPropagation();
    e?.preventDefault();
    setShowConfirmBan(false);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`http://localhost:8000/users/${userId}/ban`, {
        method: "PUT",
        credentials: "include",
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.detail || "Ошибка при блокировке пользователя");
      }
    } catch (err) {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  const handleUnban = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.stopPropagation();
    e?.preventDefault();
    setShowConfirmUnban(false);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`http://localhost:8000/users/${userId}/unban`, {
        method: "PUT",
        credentials: "include",
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.detail || "Ошибка при разблокировке пользователя");
      }
    } catch (err) {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 flex flex-col items-start gap-4">
      {!isBanned && (
        <div>
          {!showConfirmBan ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setShowConfirmBan(true);
              }}
              disabled={loading}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-semibold transition"
              style={{ cursor: "pointer", pointerEvents: "auto", zIndex: 50 }}
            >
              {loading ? "Блокировка..." : "Заблокировать"}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void handleBan(e);
                }}
                disabled={loading}
                className="px-4 py-2 bg-red-700 hover:bg-red-800 disabled:bg-red-300 text-white rounded-lg font-semibold transition"
              >
                {loading ? "Блокировка..." : "Подтвердить"}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setShowConfirmBan(false);
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

      {isBanned && (
        <div>
          {!showConfirmUnban ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setShowConfirmUnban(true);
              }}
              disabled={loading}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-semibold transition"
              style={{ cursor: "pointer", pointerEvents: "auto", zIndex: 50 }}
            >
              {loading ? "Разблокировка..." : "Разблокировать"}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void handleUnban(e);
                }}
                disabled={loading}
                className="px-4 py-2 bg-green-700 hover:bg-green-800 disabled:bg-green-300 text-white rounded-lg font-semibold transition"
              >
                {loading ? "Разблокировка..." : "Подтвердить"}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setShowConfirmUnban(false);
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

      {error && (
        <p className="text-red-600 text-sm">{error}</p>
      )}
    </div>
  );
}
