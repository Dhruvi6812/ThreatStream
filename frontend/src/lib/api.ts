const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchThreats(params: {
  min_score?: number;
  country?: string;
  limit?: number;
  offset?: number;
}) {
  const query = new URLSearchParams();

  if (params.min_score !== undefined)
    query.set("min_score", String(params.min_score));
  if (params.country) query.set("country", params.country);
  if (params.limit !== undefined)
    query.set("limit", String(params.limit));
  if (params.offset !== undefined)
    query.set("offset", String(params.offset));

  const res = await fetch(
    `${API_BASE}/threats?${query.toString()}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch threats");
  }

  return res.json();
}
