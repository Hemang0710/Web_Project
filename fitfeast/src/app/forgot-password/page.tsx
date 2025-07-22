"use client";
import { useState } from "react";
import FitFeastLayout from "../components/layout/FitFeastLayout";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send reset link");
      setSuccess("If an account with that email exists, a reset link has been sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <FitFeastLayout>
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mb-6">
              <span className="text-white font-bold text-2xl">F</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Forgot your password?</h2>
            <p className="text-gray-600">Enter your email to receive a password reset link.</p>
          </div>
          <form className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 space-y-6" onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg mb-2"
              required
            />
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transform hover:scale-105 shadow-lg shadow-emerald-500/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
            {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
            {success && <div className="text-green-600 text-sm mt-2">{success}</div>}
          </form>
          <div className="text-center text-sm text-gray-600">
            <a href="/signin" className="text-emerald-600 hover:underline">Back to sign in</a>
          </div>
        </div>
      </div>
    </FitFeastLayout>
  );
} 