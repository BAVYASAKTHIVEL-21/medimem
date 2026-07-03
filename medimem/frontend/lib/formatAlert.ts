/** Clean Cognee markdown alert text for UI display */

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/#{1,6}\s/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\u2192/g, "→")
    .replace(/[\u202f\u2011]/g, " ")
    .trim();
}

function parseLines(desc: string): string[] {
  return stripMarkdown(desc)
    .split(/\n+/)
    .map((line) => line.replace(/^[\s•\-*]+/, "").trim())
    .filter(Boolean);
}

const HEADER_RE =
  /^(health.?risk|drug.?related|medication safety|allergies?|warnings?\s*&|conditions that need)/i;

const BOILERPLATE_RE =
  /^(keep all medicines|store in a|consult your|follow.?up with|take as directed)/i;

function substantiveLines(desc: string): string[] {
  return parseLines(desc).filter(
    (line) => line.length > 8 && !HEADER_RE.test(line) && !BOILERPLATE_RE.test(line)
  );
}

/** Short label for a card — e.g. "Iodine contrast dye" */
export function alertHeadline(
  desc: string,
  fallback = "Risk alert"
): string {
  const lines = substantiveLines(desc);
  const line = lines[0] || parseLines(desc).find((l) => !HEADER_RE.test(l)) || fallback;
  if (line.length <= 72) return line;
  const short = line.split(/[–—]/)[0]?.trim();
  if (short && short.length >= 24) return `${short}…`;
  return `${line.slice(0, 69)}…`;
}

/** One-line summary for previews */
export function alertSummary(desc: string, maxLen = 140): string {
  const lines = substantiveLines(desc);
  const text = (lines[0] || parseLines(desc)[0] || "").replace(/\s+/g, " ");
  if (!text) return "";
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen).replace(/\s+\S*$/, "")}…`;
}

/** Bullet list for full alert view */
export function alertBullets(desc: string, max = 5): string[] {
  return substantiveLines(desc).slice(0, max);
}

/** Plain paragraph for detail text */
export function formatAlertDesc(desc: string, maxLen = 400): string {
  const text = substantiveLines(desc).join(" · ").replace(/\s+/g, " ");
  if (!text) return stripMarkdown(desc).replace(/\s+/g, " ").slice(0, maxLen);
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen).replace(/\s+\S*$/, "")}…`;
}
