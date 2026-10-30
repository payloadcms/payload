const aspectRatioPattern = /^\s*(\d+(?:\.\d+)?|\.\d+)\s*:\s*(\d+(?:\.\d+)?|\.\d+)\s*$/

/**
 * Parses a `W:H` aspect ratio string (e.g. `16:9`, `4:3`, `1.91:1`) into a width/height ratio.
 * Returns `undefined` when the value is not two positive numbers separated by a colon.
 */
export const parseAspectRatio = ({ value }: { value: string }): number | undefined => {
  const match = aspectRatioPattern.exec(value)

  if (!match) {
    return undefined
  }

  const width = Number(match[1])
  const height = Number(match[2])

  if (!(width > 0) || !(height > 0)) {
    return undefined
  }

  return width / height
}
