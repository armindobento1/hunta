export function formatScore(score: number, unit?: string): string {
  if (unit !== "in") return `${score} ${unit || "pts"}`;
  const totalEighths = Math.round(score * 8);
  const inches = Math.floor(totalEighths / 8);
  const eighths = totalEighths % 8;
  if (eighths === 0) return `${inches} in`;
  return inches === 0 ? `${eighths}/8 in` : `${inches} ${eighths}/8 in`;
}
