export function validatePDF(buffer: Buffer) {
  // Check for PDF header
  const header = buffer.subarray(0, 8).toString('latin1')
  if (!header.startsWith('%PDF-')) {
    return false
  }

  // Check for EOF marker and xref table
  const endSize = Math.min(1024, buffer.length)
  const end = buffer.subarray(buffer.length - endSize).toString('latin1')

  if (!end.includes('%%EOF') || !end.includes('xref')) {
    return false
  }

  return true
}
