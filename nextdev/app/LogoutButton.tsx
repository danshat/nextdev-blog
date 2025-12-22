"use client";

export default function LogoutButton() {
  const handleLogout = async () => {
    await fetch("http://localhost:8000/auth/logout", { method: "POST", credentials: "include" });
    window.location.href = "/login";
  };
  return (
    <button
      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
      onClick={handleLogout}
    >
      Выйти
    </button>
  );
}