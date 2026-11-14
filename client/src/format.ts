export function formatScore(score: number): string {
  return Number.isInteger(score) ? String(score) : score.toFixed(2);
}

export function formatScoreShort(score: number): string {
  return Number.isInteger(score)
    ? String(score)
    : String(Number(score.toFixed(2)));
}
