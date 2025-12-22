"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface DeletePostButtonProps {
  postId: number;
  isAuthor: boolean;
  isModeratorOrAdmin: boolean;
}

export default function DeletePostButton({
  postId,
  isAuthor,
  isModeratorOrAdmin,
}: DeletePostButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Don't show button if user doesn't have permission
  if (!isAuthor && !isModeratorOrAdmin) {
    return null;
  }

  const handleDelete = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.stopPropagation();
    e?.preventDefault();
    setShowConfirm(false);
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/posts/${postId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        router.push("/");
      } else {
        const data = await res.json().catch(() => null);
        alert(data?.detail || "Ошибка при удалении статьи");
      }
    } catch (err) {
      alert("Ошибка сети при удалении статьи");
    } finally {
      setLoading(false);
    }
  };

  const handleClickShowConfirm = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    setShowConfirm(true);
  };

  return (
    <div className="mt-6" onClick={(e) => e.stopPropagation()}>
      {!showConfirm ? (
        <button
          type="button"
          onClick={handleClickShowConfirm}
          disabled={loading}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-semibold transition"
          style={{ cursor: "pointer", pointerEvents: "auto", zIndex: 50 }}
        >
          {loading ? "Удаление..." : "Удалить статью..."}
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              void handleDelete(e);
            }}
            disabled={loading}
            className="px-4 py-2 bg-red-700 hover:bg-red-800 disabled:bg-red-300 text-white rounded-lg font-semibold transition"
          >
            {loading ? "Удаление..." : "Подтвердить"}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setShowConfirm(false);
            }}
            disabled={loading}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-800 rounded-lg"
          >
            Отмена
          </button>
        </div>
      )}
    </div>
  );
}
