"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import FitFeastLayout from "../components/layout/FitFeastLayout";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams?.get("token");
    const email = searchParams?.get("email");
    if (!token || !email) {
      setStatus("error");
      setMessage("Invalid verification link.");
      return;
    }
    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMessage(data.message || "Email verified successfully!");
          setTimeout(() => router.push("/signin"), 2000);
        } else {
          setStatus("error");
          setMessage(data.message || "Verification failed.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Verification failed.");
      });
  }, [searchParams, router]);

  return (
    <FitFeastLayout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
          {status === "loading" && <div>Verifying your email...</div>}
          {status === "success" && <div className="text-green-600 font-semibold text-lg">{message}</div>}
          {status === "error" && <div className="text-red-500 font-semibold text-lg">{message}</div>}
        </div>
      </div>
    </FitFeastLayout>
  );
} 