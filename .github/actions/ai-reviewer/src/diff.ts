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
