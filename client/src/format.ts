export function formatScore(score: number): string {
  return Number.isInteger(score) ? String(score) : score.toFixed(2);
}
