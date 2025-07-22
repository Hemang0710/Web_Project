"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import FitFeastLayout from "../components/layout/FitFeastLayout";

export default function Signup() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Signup failed");
      setSuccess("Account created! Redirecting to sign in...");
      setTimeout(() => router.push("/signin"), 1500);
    } catch (err: any) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <FitFeastLayout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg animate-fade-in">
              <span className="text-white font-bold text-2xl">F</span>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">Create your account 🚀</h2>
            <p className="text-gray-600 text-base">Sign up to start your health journey with FitFeast</p>
          </div>
          <form className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 space-y-6 animate-fade-in-up" onSubmit={handleSubmit} autoComplete="on">
            <label className="block text-sm font-medium text-gray-700 text-left" htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 transition mb-2"
              required
              autoComplete="name"
            />
            <label className="block text-sm font-medium text-gray-700 text-left" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 transition mb-2"
              required
              autoComplete="email"
            />
            <label className="block text-sm font-medium text-gray-700 text-left" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Password (min 6 characters)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 transition mb-2"
              minLength={6}
              required
              autoComplete="new-password"
            />
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transform hover:scale-105 shadow-lg shadow-emerald-500/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                  Creating account...
                </span>
              ) : (
                "Sign Up"
              )}
            </button>
            {error && <div className="text-red-500 text-sm mt-2 text-center animate-shake">{error}</div>}
            {success && <div className="text-green-600 text-sm mt-2 text-center animate-fade-in">{success}</div>}
          </form>
          <div className="text-center text-sm text-gray-600 mt-4">
            Already have an account? <a href="/signin" className="text-emerald-600 hover:underline font-semibold">Sign in</a>
          </div>
        </div>
      </div>
    </FitFeastLayout>
  );
} 