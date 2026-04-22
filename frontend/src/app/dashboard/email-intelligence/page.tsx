"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function EmailIntelligence() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ---------- LOAD USER ----------
  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      router.push("/login");
      return;
    }

    const user = JSON.parse(storedUser);
    setUserId(user.id);
  }, [router]);

  // ---------- LOGOUT ----------
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("user");
    router.push("/login");
  };

  // ---------- STATUS STYLE ----------
  const getStatusStyle = (status: string) => {
    if (status?.includes("High")) return "text-red-400";
    if (status?.includes("Suspicious")) return "text-yellow-400";
    return "text-green-400";
  };

  // ---------- SCAN ----------
  const scanEmail = async () => {
    if (!userId) return;

    if (!email || !email.includes("@")) {
      alert("Enter valid email");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/email/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, userId }),
      });

      const data = await res.json();
      setResult(data);
    } catch {
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ---------- HISTORY ----------
  const loadHistory = async () => {
    if (!userId) return;

    const res = await fetch(`/api/email/history?userId=${userId}`);
    const data = await res.json();

    if (res.ok) setHistory(data);
  };

  return (
    <div className="relative min-h-screen text-white">

      {/* BACKGROUND IMAGE */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-10"
        style={{ backgroundImage: "url('/emailscam.jpg')" }}
      />

      {/* OVERLAY */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/95 via-slate-900/90 to-black/80" />

      {/* CONTENT */}
      <div className="relative z-10 p-8 max-w-5xl mx-auto">

        {/* HEADER */}
        <div className="flex justify-between items-start mb-8">

          <div>
            <Link
              href="/dashboard"
              className="inline-block mb-3 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition"
            >
              ← Back
            </Link>

            <h1 className="text-3xl font-bold text-blue-400">
              Email Intelligence
            </h1>

            <p className="text-gray-400 mt-2 text-sm">
              Detect phishing, spoofing, and suspicious email patterns.
            </p>
          </div>

          {/* LOGOUT */}
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-lg transition"
          >
            Logout
          </button>
        </div>

        {/* INPUT SECTION */}
        <div className="flex flex-wrap gap-4 mb-6">

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && scanEmail()}
            placeholder="Enter email (e.g. paypal-support@gmail.com)"
            className="flex-1 min-w-[250px] px-4 py-2 rounded bg-gray-800/80 border border-gray-600 focus:outline-none focus:border-blue-400"
          />

          <button
            onClick={scanEmail}
            disabled={loading}
            className="px-5 py-2 bg-blue-500 rounded hover:bg-blue-600 transition"
          >
            {loading ? "Scanning..." : "Scan"}
          </button>

          <button
            onClick={loadHistory}
            className="px-5 py-2 bg-green-500 rounded hover:bg-green-600 transition"
          >
            Load History
          </button>
        </div>

        {/* RESULT */}
        {result && (
          <div className="bg-gray-900 border border-blue-500/20 rounded-lg p-6 shadow-lg mb-6">

            <h2 className="text-lg font-semibold mb-3 text-blue-300">
              Scan Result
            </h2>

            <p><b>Email:</b> {result.email}</p>
            <p><b>Domain:</b> {result.domain}</p>

            <p className="mt-2">
              <b>Risk Score:</b>{" "}
              <span className="text-yellow-400">{result.riskScore}%</span>
            </p>

            <p className={getStatusStyle(result.classification)}>
              <b>Status:</b> {result.classification}
            </p>

            <p className="mt-3 text-sm text-gray-400">
              ⚠️ Based on domain reputation, typo detection, unicode analysis, and phishing patterns.
            </p>
          </div>
        )}

        {/* HISTORY */}
        <div>
          <h2 className="text-xl font-semibold mb-3">History</h2>

          {history.length === 0 ? (
            <p className="text-gray-400 text-sm">
              No scans yet. Try scanning an email.
            </p>
          ) : (
            history.map((item, index) => (
              <div
                key={index}
                className="bg-gray-900 border border-gray-700 p-4 mb-3 rounded-lg hover:border-blue-400 transition"
              >
                <p><b>Email:</b> {item.email}</p>
                <p><b>Risk:</b> {item.riskScore}</p>

                <p className={getStatusStyle(item.classification)}>
                  <b>Type:</b> {item.classification}
                </p>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}