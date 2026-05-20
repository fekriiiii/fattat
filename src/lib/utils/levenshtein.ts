export function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

// Returns true if typed is an acceptable match for any of the accepted answers,
// allowing one-character typos for answers longer than 5 characters.
export function isAcceptedAnswer(typed: string, accepted: string[]): boolean {
  const t = typed.toLowerCase()
  return accepted.some(s => {
    const a = s.toLowerCase()
    if (t === a) return true
    if (a.length > 5 && levenshtein(t, a) === 1) return true
    return false
  })
}
