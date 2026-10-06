export type LabelSegment = { isMatch: boolean; text: string }

/**
 * Splits `label` into consecutive matched / unmatched runs based on `indices`
 * (ascending positions into `label`). Used to render fuzzy-match highlighting.
 * Empty/absent indices yield a single unmatched segment containing the whole label.
 */
export function splitLabelByMatches(label: string, indices?: number[]): LabelSegment[] {
  if (!label) {
    return []
  }

  if (!indices || indices.length === 0) {
    return [{ isMatch: false, text: label }]
  }

  const matchSet = new Set(indices)
  const segments: LabelSegment[] = []
  let currentText = ''
  let currentIsMatch = matchSet.has(0)

  for (let i = 0; i < label.length; i++) {
    const isMatch = matchSet.has(i)

    if (isMatch !== currentIsMatch) {
      if (currentText) {
        segments.push({ isMatch: currentIsMatch, text: currentText })
      }
      currentText = label[i]
      currentIsMatch = isMatch
    } else {
      currentText += label[i]
    }
  }

  if (currentText) {
    segments.push({ isMatch: currentIsMatch, text: currentText })
  }

  return segments
}
