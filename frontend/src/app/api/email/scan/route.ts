import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const IPQS_API_KEY = process.env.IPQS_API_KEY;

// ---------- HELPERS ----------
function extractDomain(email: string) {
  return email.includes("@") ? email.split("@")[1] : "";
}

function extractUsername(email: string) {
  return email.includes("@") ? email.split("@")[0] : "";
}

// ----------  UNICODE DETECTION ----------
function hasUnicode(text: string) {
  return /[^\x00-\x7F]/.test(text);
}

// ---------- BASIC CHECKS ----------
function isDisposable(domain: string) {
  const list = ["tempmail.com", "10minutemail.com", "mailinator.com"];
  return list.includes(domain);
}

function isSuspiciousTld(domain: string) {
  return [".xyz", ".ru", ".tk", ".click"].some((tld) =>
    domain.endsWith(tld)
  );
}

function hasSuspiciousKeywords(email: string) {
  return ["support", "secure", "verify", "bank"].some((k) =>
    email.toLowerCase().includes(k)
  );
}

// ---------- LEVENSHTEIN ----------
function levenshtein(a: string, b: string) {
  const matrix = Array.from({ length: b.length + 1 }, () =>
    Array(a.length + 1).fill(0)
  );

  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      matrix[j][i] =
        a[i - 1] === b[j - 1]
          ? matrix[j - 1][i - 1]
          : Math.min(
              matrix[j - 1][i - 1] + 1,
              matrix[j][i - 1] + 1,
              matrix[j - 1][i] + 1
            );
    }
  }

  return matrix[b.length][a.length];
}

// ---------- BRAND ----------
const brands = ["amazon", "paypal", "google", "apple"];

// ----------  STRONG NORMALIZATION ----------
function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[0o]/g, "o")
    .replace(/[1lI|]/g, "l")   
    .replace(/[3]/g, "e")
    .replace(/[5]/g, "s");
}

function isTypoBrand(text: string) {
  const normalized = normalize(text);
  const parts = normalized.split(/[\.\-_]/);

  return brands.some((b) =>
    parts.some((part) => {
      const dist = levenshtein(part, b);
      return dist > 0 && dist <= 2;
    })
  );
}

function containsBrand(text: string) {
  const normalized = normalize(text);
  return brands.some((b) => normalized.includes(b));
}

// ---------- DOMAIN ----------
function analyzeDomain(domain: string) {
  return {
    length: domain.length,
    subdomains: domain.split(".").length - 2,
    hasNumbers: /\d/.test(domain),
  };
}

function isDomainSpoof(domain: string) {
  const name = domain.split(".")[0];
  const normalized = normalize(name);

  return brands.some((b) => {
    const dist = levenshtein(normalized, b);
    return dist <= 2 && normalized.startsWith(b.slice(0, 2));
  });
}

function isFakeTLD(domain: string) {
  const parts = domain.split(".");
  const originalTld = parts[parts.length - 1];
  const tld = originalTld.toLowerCase();

  if (originalTld === "com") return false;

  if (tld === "com" && originalTld !== "com") return true;

  if (["c0m", "co0", "corn"].includes(tld)) return true;

  const dist = levenshtein(tld, "com");
  if (dist === 1) return true;

  return false;
}

// ---------- API ----------
async function checkIPQS(email: string) {
  try {
    if (!IPQS_API_KEY) return null;

    const res = await fetch(
      `https://ipqualityscore.com/api/json/email/${IPQS_API_KEY}/${email}`
    );

    if (!res.ok) return null;

    return await res.json();
  } catch {
    return null;
  }
}

// ---------- AI-LIKE SCORING ----------
function calculateRisk(local: any, ipqs: any, domain: string) {
  let score = 0;

  // ----------  HARD FAIL ----------
  if (local.fakeTld) return 100;
  if (local.hasUnicode) score += 80;

  // ---------- NEGATIVE ----------
  const weights = {
    disposable: 0.9,
    suspiciousTld: 0.4,
    keyword: 0.4,
    typoDomain: 0.8,
    fakeBrandDomain: 0.8,
    typoUsername: 0.4,
    brandUsername: 0.2,
  };

  score += (local.disposable ? 1 : 0) * weights.disposable * 100;
  score += (local.suspiciousTld ? 1 : 0) * weights.suspiciousTld * 100;
  score += (local.keyword ? 1 : 0) * weights.keyword * 100;
  score += (local.typoDomain ? 1 : 0) * weights.typoDomain * 100;
  score += (local.fakeBrandDomain ? 1 : 0) * weights.fakeBrandDomain * 100;
  score += (local.typoUsername ? 1 : 0) * weights.typoUsername * 100;
  score += (local.brandUsername ? 1 : 0) * weights.brandUsername * 100;

  // ---------- TRUST ----------
  const trustedDomains = ["gmail.com", "yahoo.com", "outlook.com"];

  if (trustedDomains.includes(domain)) {
    score -= 30;
  }

  // If trusted domain + clean username → force legit
  if (
    ["gmail.com", "yahoo.com", "outlook.com"].includes(domain) && 
    /^[a-z0-9]+$/i.test(local.username) &&
    !local.keyword &&
    !local.typoUsername
  ) {
    return 0;
  }

  if (/^[a-z0-9]+$/i.test(local.username || "")) {
    score -= 20;
  }

  if (
    !local.typoDomain &&
    !local.fakeBrandDomain &&
    !local.fakeTld &&
    !local.typoUsername &&
    !local.brandUsername &&
    !local.keyword &&
    !local.disposable &&
    !local.hasUnicode
  ) {
    score -= 40;
  }

  // ---------- IPQS ----------
  if (ipqs) {
    if (ipqs.disposable) score += 50;
    if (ipqs.spam_trap) score += 60;
    if (ipqs.fraud_score > 85) score += 70;
    if (!ipqs.valid) score += 50;
  }

  return Math.max(0, Math.min(Math.round(score), 100));
}

function classify(score: number) {
  if (score < 30) return "Legit";
  if (score < 70) return "Suspicious";
  return "High Risk";
}

// ---------- MAIN ----------
export async function POST(req: Request) {
  try {
    const { email, userId } = await req.json();

    if (!email || !userId) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found. Please login again." },
        { status: 400 }
      );
    }

    const domain = extractDomain(email);
    const username = extractUsername(email);

    const localSignals = {
      username,
      hasUnicode: hasUnicode(email), 
      disposable: isDisposable(domain),
      suspiciousTld: isSuspiciousTld(domain),
      keyword: hasSuspiciousKeywords(email),

      fakeBrandDomain:
        containsBrand(domain.split(".")[0]) && !domain.endsWith(".com"),

      typoDomain: isDomainSpoof(domain),
      fakeTld: isFakeTLD(domain),

      typoUsername: isTypoBrand(username),
      brandUsername: containsBrand(username),
    };

    const domainIntel = analyzeDomain(domain);
    const ipqs = await checkIPQS(email);

    const riskScore = calculateRisk(localSignals, ipqs, domain);
    const classification = classify(riskScore);

    const result = await prisma.emailScan.create({
      data: {
        email,
        domain,
        riskScore,
        classification,
        disposable: localSignals.disposable,
        mxValid: true,
        suspiciousTld: localSignals.suspiciousTld,
        userId,
      },
    });

    return NextResponse.json({
      ...result,
      domainIntel,
      ipqs,
      signals: localSignals,
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}