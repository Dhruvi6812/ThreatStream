export const revalidate = 0;

import Link from "next/link";
import ClientThreatTable from "@/components/ClientThreatTable";
import IPSearchBox from "@/components/IPSearchBox";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { fetchThreats } from "@/lib/api";

const LIMIT = 5;

export default async function IPPage({
  searchParams,
}: {
  searchParams: Promise<{
    min_score?: string;
    country?: string;
    offset?: string;
  }>;
}) {
  const params = await searchParams;

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const min_score = params.min_score ? Number(params.min_score) : 0;
  const country = params.country || undefined;
  const offset = params.offset ? Number(params.offset) : 0;

  const data = await fetchThreats({
    min_score,
    country,
    limit: LIMIT,
    offset,
  });

  const threats = data?.results ?? [];
  const total = data?.total ?? 0;
  const meta = data.meta ?? {};

  const prevOffset = Math.max(offset - LIMIT, 0);
  const nextOffset = offset + LIMIT;

  const currentPage =
    total === 0 ? 0 : Math.floor(offset / LIMIT) + 1;

  const totalPages =
    total === 0 ? 0 : Math.ceil(total / LIMIT);

  const baseQuery = new URLSearchParams();
  if (min_score) baseQuery.set("min_score", String(min_score));
  if (country) baseQuery.set("country", country);

  const prevUrl = `/dashboard/ip-intelligence?${new URLSearchParams({
    ...Object.fromEntries(baseQuery),
    offset: String(prevOffset),
  })}`;

  const nextUrl = `/dashboard/ip-intelligence?${new URLSearchParams({
    ...Object.fromEntries(baseQuery),
    offset: String(nextOffset),
  })}`;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-slate-100 p-8">
      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-block mb-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm"
          >
            ← Back
          </Link>

          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-cyan-400">
                IP Intelligence
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Analyze IP threats, abuse reports, and risk scores.
              </p>
            </div>

            <form action="/api/auth/logout" method="POST">
              <button className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded">
                Logout
              </button>
            </form>
          </div>
        </div>

        {/* SEARCH */}
        <IPSearchBox defaultValue="" />

        {/* FILTERS */}
        <form className="flex gap-4 mb-8 bg-slate-900 p-4 rounded-lg border border-slate-700">
          <input name="min_score" placeholder="Min Score" />
          <input name="country" placeholder="Country" />
          <button className="bg-cyan-600 px-4 py-2 rounded">
            Apply
          </button>
        </form>

        {/* TABLE */}
        <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
          {threats.length === 0 ? (
            <p className="text-slate-400">
              No threats found
            </p>
          ) : (
            <ClientThreatTable threats={threats} meta={meta} />
          )}
        </div>

        {/* PAGINATION */}
        <div className="mt-8 flex justify-between">
          {offset > 0 ? (
            <Link href={prevUrl}>← Previous</Link>
          ) : (
            <span className="opacity-40">← Previous</span>
          )}

          <span>
            Page {currentPage} of {totalPages}
          </span>

          {nextOffset < total ? (
            <Link href={nextUrl}>Next →</Link>
          ) : (
            <span className="opacity-40">Next →</span>
          )}
        </div>

      </div>
    </main>
  );
}