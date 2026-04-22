"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Signup failed");
        setLoading(false);
        return;
      }

      router.push("/dashboard");

    } catch (err) {
      console.error(err);
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center text-white overflow-hidden">

      {/* BACKGROUND */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-black" />

      {/* GLOW EFFECT */}
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_30%,rgba(34,197,94,0.15),transparent_40%),radial-gradient(circle_at_70%_70%,rgba(0,255,255,0.1),transparent_40%)]" />

      {/* SIGNUP CARD */}
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-96 p-8 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-[0_0_40px_rgba(34,197,94,0.1)] flex flex-col gap-5 transition-all"
      >
        {/* Branding */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-cyan-400">
            ThreatStream
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Real-time Cyber Threat Intelligence
          </p>
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-center mt-2">
          Create Account
        </h2>

        {/* Error */}
        {error && (
          <p className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded py-2">
            {error}
          </p>
        )}

        {/* Email */}
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="bg-white/5 border border-white/10 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
        />

        {/* Password */}
        <input
          name="password"
          type="password"
          placeholder="Password"
          required
          className="bg-white/5 border border-white/10 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
        />

        {/* Button */}
        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 hover:bg-green-500 text-black font-semibold py-2 rounded-lg transition-all hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]"
        >
          {loading ? "Creating..." : "Create Account"}
        </button>

        {/* Login Link */}
        <p className="text-sm text-center text-gray-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-cyan-400 hover:underline"
          >
            Login
          </Link>
        </p>
      </form>
    </main>
  );
}