"use client";

import { useRouter } from "next/navigation";

export default function DashboardHome() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <div className="relative min-h-screen text-white">

      {/* BACKGROUND */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-black" />

      {/* CONTENT */}
      <div className="relative z-10 p-10 max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-bold text-cyan-400">
            ThreatStream Dashboard
          </h1>

          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-lg"
          >
            Logout
          </button>
        </div>

        {/* CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* IP */}
          <div
            onClick={() => router.push("/dashboard/ip-intelligence")}
            className="cursor-pointer bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-2xl hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,255,0.2)] transition"
          >
            <h2 className="text-xl font-semibold text-cyan-300 mb-2">
              🌐 IP Intelligence
            </h2>
            <p className="text-gray-400">
              Analyze IP threats, abuse reports, and risk scores.
            </p>
          </div>

          {/* EMAIL */}
          <div
            onClick={() => router.push("/dashboard/email-intelligence")}
            className="cursor-pointer bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-2xl hover:scale-105 hover:shadow-[0_0_30px_rgba(34,197,94,0.2)] transition"
          >
            <h2 className="text-xl font-semibold text-green-300 mb-2">
              📧 Email Intelligence
            </h2>
            <p className="text-gray-400">
              Detect phishing, spoofing, and suspicious emails.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}