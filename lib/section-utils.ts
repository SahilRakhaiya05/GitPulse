export function timeAgo(date: string | null | undefined): string {
  if (!date) return "–";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.max(1, Math.round(diff / 60_000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" });
}

export function shortSha(sha: string): string {
  return sha.slice(0, 7);
}

/** Convert a GitHub hex label colour to a readable Tailwind-friendly inline style pair */
export function labelStyle(hex: string): { background: string; color: string } {
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  // luminance
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return {
    background: `#${hex}33`,
    color: `#${hex}`
  };
}
