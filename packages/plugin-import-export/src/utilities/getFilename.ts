/**
 * Generates a filename based on current date and time.
 * Format: "YYYY-MM-DD_HH-MM-SS" (filesystem-safe characters)
 */
export const getFilename = () => {
  const now = new Date()
  const yyymmdd = now.toISOString().split('T')[0] // "YYYY-MM-DD"
  const hhmmss = now.toTimeString().split(' ')[0]?.replace(/:/g, '-') || '' // "HH-MM-SS"

  return `${yyymmdd}_${hhmmss}`
}
