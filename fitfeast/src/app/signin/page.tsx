'use client';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import FitFeastLayout from '../components/layout/FitFeastLayout';

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams?.get('from') || '/dashboard';

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    await signIn("google", { callbackUrl: from });
  };

  const handleCredentialsSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      callbackUrl: from,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError(res.error === "CredentialsSignin" ? "Invalid email or password" : res.error);
    } else if (res?.ok) {
      router.push(from);
    }
  };

  return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg animate-fade-in">
              <span className="text-white font-bold text-2xl">F</span>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">Welcome Back 👋</h2>
            <p className="text-gray-600 text-base">Sign in to continue your health journey with FitFeast</p>
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 space-y-6 animate-fade-in-up">
            <form className="space-y-4" onSubmit={handleCredentialsSignIn} autoComplete="on">
              <label className="block text-sm font-medium text-gray-700 text-left" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"
                required
                autoComplete="email"
              />
              <label className="block text-sm font-medium text-gray-700 text-left" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"
                required
                autoComplete="current-password"
              />
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transform hover:scale-105 shadow-lg shadow-emerald-500/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>
              {error && <div className="text-red-500 text-sm mt-2 text-center animate-shake">{error}</div>}
            </form>
            <div className="flex items-center my-4">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="mx-2 text-gray-400 text-xs">OR</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-gray-200 rounded-xl text-base font-semibold text-gray-700 bg-white hover:bg-emerald-50 hover:text-emerald-700 transform hover:scale-105 shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-400 transition-all duration-200"
              type="button"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.23l6.85-6.85C36.68 2.7 30.77 0 24 0 14.82 0 6.71 5.13 2.69 12.56l7.98 6.2C13.13 13.09 18.18 9.5 24 9.5z"/><path fill="#34A853" d="M46.1 24.55c0-1.64-.15-3.22-.43-4.74H24v9.01h12.44c-.54 2.9-2.18 5.36-4.66 7.02l7.2 5.6C43.93 37.13 46.1 31.36 46.1 24.55z"/><path fill="#FBBC05" d="M10.67 28.13c-1.13-3.36-1.13-6.9 0-10.26l-7.98-6.2C.7 15.29 0 19.53 0 24c0 4.47.7 8.71 2.69 12.33l7.98-6.2z"/><path fill="#EA4335" d="M24 48c6.48 0 11.92-2.15 15.89-5.87l-7.2-5.6c-2.01 1.35-4.6 2.15-8.69 2.15-5.82 0-10.87-3.59-13.33-8.86l-7.98 6.2C6.71 42.87 14.82 48 24 48z"/></g></svg>
              Sign in with Google
            </button>
          </div>
          <div className="text-center text-sm text-gray-600 mt-4">
            Don&apos;t have an account? <a href="/signup" className="text-emerald-600 hover:underline font-semibold">Sign up</a>
          </div>
          <div className="text-center text-sm text-gray-600 mt-2">
            <a href="/forgot-password" className="text-emerald-600 hover:underline font-semibold">Forgot password?</a>
          </div>
        </div>
      </div>
  );
}

export default function SignIn() {
  return (
    <FitFeastLayout>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-white font-bold text-2xl">F</span>
            </div>
            <div className="text-2xl font-bold text-gray-700 mb-2">Loading...</div>
            <p className="text-gray-500">Preparing your sign-in experience</p>
          </div>
        </div>
      }>
        <SignInForm />
      </Suspense>
    </FitFeastLayout>
  );
}