export function validatePDF(buffer: Buffer) {
  const text = buffer.toString('latin1')

  // Header must exist at start
  if (!text.startsWith('%PDF-1.')) {
    return false
  }

  // EOF marker must exist near end of file
  if (!text.includes('%%EOF')) {
    return false
  }

  // Must contain at least one object and endobj pair
  if (!text.match(/\d+\s+\d+\s+obj/)) {
    return false
  }
  if (!text.includes('endobj')) {
    return false
  }

  return true
}
