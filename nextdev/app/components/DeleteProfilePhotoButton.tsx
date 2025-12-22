"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  userId: number;
  userRole: string;
  hasPhoto: boolean;
}

export default function DeleteProfilePhotoButton({ userId, userRole, hasPhoto }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (userRole !== "admin" && userRole !== "moderator") {
    return null;
  }

  if (!hasPhoto) {
    return null;
  }

  const handleDelete = async () => {
    if (!confirm("Вы уверены, что хотите удалить фото профиля пользователя?")) {
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`http://localhost:8000/users/${userId}/profile-photo`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.detail || "Ошибка при удалении фото");
      }
    } catch (err) {
      setError("Ошибка сети при удалении фото");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3">
      <button
        onClick={handleDelete}
        disabled={loading}
        className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-lg font-semibold transition"
      >
        {loading ? "Удаление..." : "Удалить фото профиля"}
      </button>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}
