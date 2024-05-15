export function generateTsObjectLiteral(obj: any): string {
  const lines = []
  const entries = Object.entries(obj)
  for (const [key, value] of entries) {
    const safeKey = /^[\w$]+$/.test(key) ? key : JSON.stringify(key)
    const line =
      typeof value === 'object' && value !== null
        ? `${safeKey}: ${generateTsObjectLiteral(value)}`
        : `${safeKey}: ${JSON.stringify(value)}`
    lines.push(line)
  }
  return `{\n  ${lines.join(',\n  ')}\n}`
}
