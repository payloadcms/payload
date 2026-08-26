const IGNORED_PATTERNS: RegExp[] = [
  /pnpm-lock\.yaml$/,
  /package-lock\.json$/,
  /yarn\.lock$/,
  /\.snap$/,
  /(^|\/)dist\//,
  /payload-types\.ts$/,
]

export function isIgnoredFile(filePath: string): boolean {
  return IGNORED_PATTERNS.some((pattern) => pattern.test(filePath))
}

export function parseChangedLineNumbers(
  fileDiffs: Array<{ path: string; diff: string }>,
): Map<string, Set<number>> {
  const result = new Map<string, Set<number>>()

  for (const { path, diff } of fileDiffs) {
    const validLines = new Set<number>()
    const lines = diff.split('\n')
    let newLineNumber = 0

    for (const line of lines) {
      const hunkMatch = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/)
      if (hunkMatch) {
        newLineNumber = parseInt(hunkMatch[1], 10)
        continue
      }
      if (newLineNumber === 0) continue

      if (line.startsWith('+')) {
        validLines.add(newLineNumber++)
      } else if (line.startsWith(' ')) {
        validLines.add(newLineNumber++)
      }
      // '-' lines don't exist in the new file, skip without incrementing
    }

    result.set(path, validLines)
  }

  return result
}

export function splitDiffByFile(diff: string): Array<{ path: string; diff: string }> {
  if (!diff.trim()) return []

  const fileChunks = diff.split(/(?=^diff --git )/m).filter(Boolean)

  return fileChunks.flatMap((chunk) => {
    const match = chunk.match(/^diff --git a\/.+ b\/(.+)$/m)
    if (!match) return []

    const filePath = match[1]
    if (isIgnoredFile(filePath)) return []

    return [{ path: filePath, diff: chunk }]
  })
}
