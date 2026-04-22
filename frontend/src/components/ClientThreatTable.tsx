"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ThreatDetailsDrawer from "./ThreatDetailsDrawer";
import { getSeverity, getSeverityStyles } from "@/lib/threatSeverity";

const AUTO_REFRESH_MS = 60000; 
const STORAGE_KEY = "threatstream:data";
const ROLE_KEY = "threatstream:role";

// Freshness helpers
function getFreshnessInfo(firstSeen: number) {
  const ageMs = Date.now() - firstSeen;

  if (ageMs < 60_000) {
    return { label: "NEW", bonus: 20, className: "bg-red-600/20 text-red-400" };
  }

  if (ageMs < 5 * 60_000) {
    return {
      label: "RECENT",
      bonus: 10,
      className: "bg-yellow-600/20 text-yellow-400",
    };
  }

  return {
    label: "STALE",
    bonus: 0,
    className: "bg-slate-700/30 text-slate-400",
  };
}

function getCountryRisk(country: string): number {
  const highRisk = ["RU", "CN", "IR", "KP"];
  const mediumRisk = ["RO", "UA", "BR", "VN"];

  if (highRisk.includes(country)) return 20;
  if (mediumRisk.includes(country)) return 10;
  return 0;
}

function getSeverityBonus(severity: string): number {
  if (severity === "Critical") return 20;
  if (severity === "High") return 10;
  return 0;
}

function calculateRiskScore(threat: {
  abuse_score: number;
  country: string;
  severity: string;
  freshnessBonus: number;
}): number {
  return (
    threat.abuse_score +
    getCountryRisk(threat.country) +
    getSeverityBonus(threat.severity) +
    threat.freshnessBonus
  );
}

type Threat = {
  ip: string;
  abuse_score: number;
  country: string;
  isp?: string | null;
};

type Role = "public" | "analyst";

export default function ClientThreatTable({
  threats,
  meta,
}: {
  threats: Threat[];
  meta?: { rate_limited?: boolean };
}) {
  const router = useRouter();

  const [role, setRole] = useState<Role>("public");
  const [selectedThreat, setSelectedThreat] = useState<Threat | null>(null);

  const [threatTags, setThreatTags] = useState<Record<string, string[]>>({});
  const [note, setNote] = useState("");

  const firstSeenRef = useRef<Map<string, number>>(new Map());

  // =========================
  // Role persistence
  // =========================
  useEffect(() => {
    const savedRole = localStorage.getItem(ROLE_KEY);
    if (savedRole === "public" || savedRole === "analyst") {
      setRole(savedRole);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(ROLE_KEY, role);
  }, [role]);

  const isAnalyst = role === "analyst";

  // =========================
  // Local storage
  // =========================
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored);
      setThreatTags(parsed.tags ?? {});
      setNote(parsed.note ?? "");
    } catch {
      console.warn("Failed to load persisted threat data");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        tags: threatTags,
        note,
      })
    );
  }, [threatTags, note]);

  // =========================
  // Auto refresh (paused when drawer open)
  // =========================
  useEffect(() => {
    if (selectedThreat) return;

    const interval = setInterval(() => {
      router.refresh();
    }, AUTO_REFRESH_MS);

    return () => clearInterval(interval);
  }, [selectedThreat, router]);

  // =========================
  // Enrich + sort
  // =========================
  const enrichedThreats = threats.map((t) => {
    if (!firstSeenRef.current.has(t.ip)) {
      firstSeenRef.current.set(t.ip, Date.now());
    }

    const firstSeen = firstSeenRef.current.get(t.ip)!;
    const freshness = getFreshnessInfo(firstSeen);
    const severity = getSeverity(t.abuse_score);

    const riskScore = calculateRiskScore({
      abuse_score: t.abuse_score,
      country: t.country,
      severity,
      freshnessBonus: freshness.bonus,
    });

    return { ...t, severity, freshness, riskScore };
  });

  const sortedThreats = enrichedThreats.sort(
    (a, b) => b.riskScore - a.riskScore
  );

  // =========================
  // Handlers
  // =========================
  function openThreat(threat: Threat) {
    setSelectedThreat(threat);
  }

  function closeThreat() {
    setSelectedThreat(null);
  }

  function toggleTag(ip: string, tag: string) {
    if (!isAnalyst) return;

    setThreatTags((prev) => {
      const existing = prev[ip] ?? [];
      return {
        ...prev,
        [ip]: existing.includes(tag)
          ? existing.filter((t) => t !== tag)
          : [...existing, tag],
      };
    });
  }

  // =========================
  // UI
  // =========================
  return (
    <>
      {/* Top Bar */}
      <div className="mb-4 flex justify-between items-center">
        <button
          onClick={() => router.refresh()}
          className="bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded text-sm"
        >
          🔄 Refresh
        </button>

        <button
          onClick={() =>
            setRole(role === "public" ? "analyst" : "public")
          }
          className={`rounded px-4 py-2 text-sm font-semibold transition ${
            isAnalyst
              ? "bg-cyan-600 text-black"
              : "bg-slate-700 text-slate-200"
          }`}
        >
          Mode: {isAnalyst ? "Analyst" : "Public"}
        </button>
      </div>
      {meta?.rate_limited && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-yellow-600 bg-yellow-900/30 px-4 py-2 text-sm text-yellow-300">
          ⚠️ <span>Showing cached data (API rate limit reached)</span>
        </div>
      )}
      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900 text-slate-300">
            <tr>
              <th className="px-4 py-3">IP Address</th>
              <th className="px-4 py-3">Severity</th>
              <th className="px-4 py-3">Freshness</th>
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3">ISP</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800">
            {sortedThreats.map((t) => {
              const styles = getSeverityStyles(t.severity);
              const isSelected = selectedThreat?.ip === t.ip;

              return (
                <tr
                  key={t.ip}
                  onClick={() => openThreat(t)}
                  className={`cursor-pointer transition hover:bg-slate-800/40 ${
                    isSelected ? "bg-slate-800/50" : ""
                  }`}
                >
                  <td className="px-4 py-3 font-mono text-cyan-400">
                    {t.ip}
                  </td>

                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles.className}`}>
                      {t.severity} ({t.abuse_score})
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${t.freshness.className}`}>
                      {t.freshness.label}
                    </span>
                  </td>

                  <td className="px-4 py-3">{t.country}</td>

                  <td className="px-4 py-3 text-slate-400">
                    {t.isp ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Drawer */}
      <ThreatDetailsDrawer
        threat={selectedThreat}
        onClose={closeThreat}
        tags={selectedThreat ? threatTags[selectedThreat.ip] ?? [] : []}
        onToggleTag={(tag) =>
          selectedThreat && toggleTag(selectedThreat.ip, tag)
        }
        note={note}
        onNoteChange={setNote}
        role={role}
      />
    </>
  );
}