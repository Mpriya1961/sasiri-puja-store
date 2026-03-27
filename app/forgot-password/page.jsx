"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Request failed");
        return;
      }

      setDone(true);
    } catch (error) {
      console.error(error);
      alert("Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          Reset Password
        </h1>
        <p className="mb-6 text-gray-600">
          A reset link will be sent to the configured email.
        </p>

        {done ? (
          <div className="rounded-xl bg-green-50 p-4 text-sm text-green-700">
            Reset email sent successfully.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-4">
            <input
              name="username"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="rounded-xl border border-gray-300 px-4 py-3"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-black px-5 py-3 text-white"
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}

        <div className="mt-4 text-sm">
          <Link href="/login" className="text-gray-600 underline">
            Back to login
          </Link>
        </div>
      </div>
    </main>
  );
}