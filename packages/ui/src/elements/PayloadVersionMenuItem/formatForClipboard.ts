export const formatForClipboard = (deps: Record<string, string>): string => {
  if (!deps.payload) {
    return ''
  }

  const rest = Object.keys(deps)
    .filter((k) => k !== 'payload')
    .sort((a, b) => a.localeCompare(b))

  const lines = [`payload: ${deps.payload}`, ...rest.map((k) => `${k}: ${deps[k]}`)]
  return lines.join('\n')
}
