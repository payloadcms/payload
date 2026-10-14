const BREAKING_HEADING = /^(#{1,6})\s+breaking changes?\b/i
const HEADING = /^(#{1,6})\s/

export function extractBreakingChangesSection(markdown: string): string | undefined {
  const lines = markdown
    .replace(/\r\n/g, '\n')
    .replace(/<!--[\s\S]*?-->/g, '')
    .split('\n')

  let inCodeFence = false
  let sectionLevel: number | undefined
  const sectionLines: string[] = []

  for (const line of lines) {
    if (line.trimStart().startsWith('```')) {
      inCodeFence = !inCodeFence
    }

    const heading = inCodeFence ? null : line.match(HEADING)

    if (sectionLevel === undefined) {
      const breakingHeading = inCodeFence ? null : line.match(BREAKING_HEADING)
      if (breakingHeading?.[1]) {
        sectionLevel = breakingHeading[1].length
      }
      continue
    }

    if (heading?.[1] && heading[1].length <= sectionLevel) {
      break
    }

    sectionLines.push(line)
  }

  const section = sectionLines.join('\n').trim()

  return section || undefined
}
