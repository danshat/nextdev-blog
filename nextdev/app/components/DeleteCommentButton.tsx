"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  commentId: number;
}

export default function DeleteCommentButton({ commentId }: Props) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const handleDelete = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.stopPropagation();
    e?.preventDefault();
    console.log("DeleteCommentButton: delete confirmed", commentId);
    setShowConfirm(false);
    setLoading(true);
    try {
      const url = `http://localhost:8000/comments/${commentId}`;
      console.log("DeleteCommentButton: sending request to", url);
      const res = await fetch(url, {
        method: "DELETE",
        credentials: "include",
      });
      console.log("DeleteCommentButton: fetch completed", res.status);
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => null);
        alert(data?.detail || "Ошибка при удалении комментария");
      }
    } catch (err) {
      console.error("DeleteCommentButton: error", err);
      alert("Ошибка сети при удалении комментария");
    } finally {
      setLoading(false);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // initial click shows inline confirm instead of browser confirm
    e.stopPropagation();
    e.preventDefault();
    console.log("DeleteCommentButton: clicked (show confirm)", commentId);
    setShowConfirm(true);
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      {!showConfirm ? (
        <button
          type="button"
          onClick={handleClick}
          disabled={loading}
          className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-md text-sm"
        >
          {loading ? "Удаление..." : "Удалить"}
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
            className="px-3 py-1 bg-red-700 hover:bg-red-800 disabled:bg-red-300 text-white rounded-md text-sm"
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
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-800 rounded-md text-sm"
          >
            Отмена
          </button>
        </div>
      )}
    </div>
  );
}
