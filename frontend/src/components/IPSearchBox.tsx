"use client";

import { useEffect, useState } from "react";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export default function IPSearchBox({
  defaultValue,
}: {
  defaultValue: string;
}) {
  const [ip, setIp] = useState(defaultValue);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // LOAD USER
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (user?.id) {
      setUserId(user.id);
      loadHistory(user.id);
    }
  }, []);

  async function loadHistory(uid: string) {
    const res = await fetch(
      `${API_BASE}/ip/history?userId=${uid}`
    );
    const data = await res.json();
    setHistory(data);
  }

  function isValidIP(ip: string) {
    const regex =
      /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
    return regex.test(ip);
  }

  function isValidDomain(input: string) {
    return /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(input);
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();

    if (!ip) return;

    setLoading(true);
    setResult(null);

    try {
      let cleanedInput = ip.trim().toLowerCase();

      // CLEAN INPUT
      cleanedInput = cleanedInput.replace(/^https?:\/\//, "");
      cleanedInput = cleanedInput.replace(/^www\./, "");
      cleanedInput = cleanedInput.replace(/\/$/, "");

      let finalIP = cleanedInput;
      let domain = "";

      // DOMAIN → IP
      if (!isValidIP(cleanedInput)) {
        if (!isValidDomain(cleanedInput)) {
          alert("❌ Invalid IP or domain");
          setLoading(false);
          return;
        }

        domain = cleanedInput;

        const dnsRes = await fetch(
          `https://dns.google/resolve?name=${cleanedInput}&type=A`
        );
        const dnsData = await dnsRes.json();

        const resolvedIP = dnsData?.Answer?.[0]?.data;

        if (!resolvedIP) {
          alert("❌ Could not resolve domain");
          setLoading(false);
          return;
        }

        finalIP = resolvedIP;
      }

      // CHECK IP
      const res = await fetch(
        `${API_BASE}/check-ip?ip=${ip}`,
        {
          method: "GET",
        }
      );

      if (!res.ok) {
        throw new Error("API failed");
      }

      const data = await res.json();

      if (data.status === "success") {
        setResult(data.data);
      } else {
        alert(data.message || "Search failed");
      }

        // SAVE
        if (userId) {
          await fetch(`${API_BASE}/ip/save`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ip: finalIP,
              domain,
              userId,
            }),
          });

          loadHistory(userId);
        }
    } catch {
      alert("Search failed");
    } finally {
      setLoading(false);
    }
  }

  async function clearHistory() {
    if (!userId) return;
    if (!confirm("Clear all search history?")) return;

    const res = await fetch(
      `${API_BASE}/ip/clear?userId=${userId}`,
      {
        method: "DELETE",
      }
    );

    if (res.ok) {
      setHistory([]);
    } else {
      alert("Failed to clear history");
    }
  }
  
  const getRiskLabel = (score: number) => {
    if (score >= 80) return { label: "High Risk", color: "text-red-400" };
    if (score >= 40) return { label: "Suspicious", color: "text-yellow-400" };
    return { label: "Safe", color: "text-green-400" };
  };

  return (
    <div className="mb-6">

      {/* SEARCH */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-4">
        <input
          value={ip}
          onChange={(e) => {
            setIp(e.target.value);
            setResult(null);
          }}
          placeholder="Search IP or domain (e.g. 8.8.8.8 or google.com)"
          className="flex-1 bg-slate-800 border px-4 py-2 rounded"
        />

        <button className="bg-blue-600 px-4 py-2 rounded">
          {loading ? "Checking..." : "Search"}
        </button>
      </form>
      {loading && (
        <div className="animate-pulse bg-slate-800 p-4 rounded mb-4">
          Fetching threat intelligence...
        </div>
      )}

      {/* RESULT (SAFE ✅) */}
      {result && (
        <div className="bg-slate-900 border border-blue-500/30 p-5 rounded-lg mb-6">
          <h2 className="text-lg font-semibold text-blue-300 mb-3">
            IP Details
          </h2>
          <button
            onClick={() => navigator.clipboard.writeText(result?.ip)}
            className="mt-2 text-xs bg-slate-700 px-2 py-1 rounded"
          >
            Copy IP
          </button>

          <p><b>Input:</b> {result?.input || ip}</p>
          <p><b>Resolved IP:</b> {result?.resolved_ip}</p>

          <p><b>IP:</b> {result?.ip}</p>
          {(() => {
            const risk = getRiskLabel(result?.abuse_score || 0);
            return (
              <p>
                <b>Risk:</b>{" "}
                <span className={risk.color}>
                  {risk.label} ({result?.abuse_score})
                </span>
              </p>
            );
          })()}
          <p><b>Country:</b> {result?.country}</p>
          <p><b>ISP:</b> {result?.isp}</p>
          <p><b>Domain:</b> {result?.domain}</p>
          <p><b>Reports:</b> {result?.reports}</p>

          <p className="mt-2 text-sm text-gray-400">
            ⚠️ Real-time lookup from AbuseIPDB
          </p>
        </div>
      )}

      {/* HISTORY */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg">Recent Searches</h2>

          {history.length > 0 && (
            <button
              onClick={clearHistory}
              className="text-sm bg-red-600 hover:bg-red-500 px-3 py-1 rounded"
            >
              Clear
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <p className="text-gray-400 text-sm">No searches yet</p>
        ) : (
          history.map((item, i) => (
            <div
              key={i}
              onClick={() => {
                const value = item.domain || item.ip;
                setIp(value);

                setTimeout(() => {
                  document.querySelector("form")?.dispatchEvent(
                    new Event("submit", { cancelable: true, bubbles: true })
                  );
                }, 100);
              }}
              className="cursor-pointer bg-slate-800 p-3 mb-2 rounded hover:bg-slate-700"
            >
              <p>{item.domain || item.ip}</p>
              <p className="text-xs text-gray-400">{item.ip}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}