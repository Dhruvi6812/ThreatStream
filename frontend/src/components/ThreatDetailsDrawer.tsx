"use client";

const TAGS = ["Botnet", "Brute Force", "Scanner", "Malware", "Suspicious"];

type Threat = {
  ip: string;
  abuse_score: number;
  country: string;
  isp?: string | null;
};

type Role = "public" | "analyst";

type Props = {
  threat: Threat | null;
  note: string;
  onNoteChange: (value: string) => void;
  tags: string[];
  onToggleTag: (tag: string) => void;
  role: Role;
  onClose: () => void;
};

export default function ThreatDetailsDrawer({
  threat,
  note,
  onNoteChange,
  tags,
  onToggleTag,
  role,
  onClose,
}: Props) {
  if (!threat) return null;

  const isAnalyst = role === "analyst";

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50">
      <div className="w-[360px] h-full bg-slate-900 shadow-xl flex flex-col animate-slide-in">

        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          <h2 className="text-xl font-semibold">Threat Details</h2>

          <div>
            <p className="text-slate-400">IP Address</p>
            <p className="font-mono">{threat.ip}</p>
          </div>

          <div>
            <p className="text-slate-400">Abuse Score</p>
            <span className="inline-block rounded-full bg-red-900/60 px-3 py-1 text-red-400 font-semibold">
              High ({threat.abuse_score})
            </span>
          </div>

          <div>
            <p className="text-slate-400">Country</p>
            <p>{threat.country}</p>
          </div>

          <div>
            <p className="text-slate-400">ISP</p>
            <p>{threat.isp ?? "Unknown"}</p>
          </div>

          {isAnalyst && (
            <div>
              <p className="text-slate-400 mb-2">Threat Tags</p>
              <div className="flex flex-wrap gap-2">
                {TAGS.map((tag) => {
                  const active = tags.includes(tag);

                  return (
                    <button
                      key={tag}
                      onClick={() => onToggleTag(tag)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        active
                          ? "bg-cyan-600 text-black"
                          : "bg-slate-700 text-slate-200"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {isAnalyst && (
            <div>
              <textarea
                value={note}
                onChange={(e) => onNoteChange(e.target.value)}
                rows={4}
                placeholder="Add investigation notes..."
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2"
              />
            </div>
          )}
        </div>

        <div className="border-t border-slate-800 p-4">
          <button
            onClick={onClose}
            className="w-full bg-slate-700 hover:bg-slate-600 py-2 rounded"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}