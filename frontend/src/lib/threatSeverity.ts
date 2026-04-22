export type Severity = "Low" | "Medium" | "High" | "Critical";

export function getSeverity(score: number): Severity {
  if (score >= 90) return "Critical";
  if (score >= 70) return "High";
  if (score >= 40) return "Medium";
  return "Low";
}

export function getSeverityStyles(severity: Severity) {
  switch (severity) {
    case "Critical":
      return {
        label: "Critical",
        className: "bg-red-900/60 text-red-300 border border-red-700",
      };
    case "High":
      return {
        label: "High",
        className: "bg-orange-900/50 text-orange-300 border border-orange-700",
      };
    case "Medium":
      return {
        label: "Medium",
        className: "bg-yellow-900/40 text-yellow-300 border border-yellow-700",
      };
    case "Low":
      return {
        label: "Low",
        className: "bg-green-900/40 text-green-300 border border-green-700",
      };
  }
}
