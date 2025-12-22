"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface Props {
  userId: number;
  isBanned: boolean;
}

export default function ProfilePhotoUpload({ userId, isBanned }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(false);
    setLoading(true);

    // Validate file type
    if (file.type !== "image/png") {
      setError("Только PNG файлы поддерживаются");
      setLoading(false);
      return;
    }

    if (!file.name.toLowerCase().endsWith(".png")) {
      setError("Файл должен иметь расширение .png");
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`http://localhost:8000/users/${userId}/profile-photo`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (res.ok) {
        setSuccess(true);
        if (inputRef.current) {
          inputRef.current.value = "";
        }
        // Wait a moment then refresh
        setTimeout(() => {
          router.refresh();
        }, 500);
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.detail || "Ошибка при загрузке фото");
      }
    } catch (err) {
      setError("Ошибка сети при загрузке фото");
    } finally {
      setLoading(false);
    }
  };

  if (isBanned) {
    return null;
  }

  return (
    <div className="mt-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Загрузить фото профиля (PNG)
      </label>
      <input
        ref={inputRef}
        type="file"
        accept=".png,image/png"
        onChange={handleFileChange}
        disabled={loading}
        className="block w-full text-sm text-gray-500 dark:text-gray-400
          file:mr-4 file:py-2 file:px-4
          file:rounded-lg file:border-0
          file:text-sm file:font-semibold
          file:bg-blue-600 file:text-white
          hover:file:bg-blue-700
          disabled:file:bg-gray-300
          cursor-pointer"
      />
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      {success && <p className="text-sm text-green-600 mt-2">✓ Фото успешно загружено</p>}
      {loading && <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Загрузка...</p>}
    </div>
  );
}
