export const getFilename = () => {
  const now = new Date()
  const yyymmdd = now.toISOString().split('T')[0] // "YYYY-MM-DD"
  const hhmmss = now.toTimeString().split(' ')[0] // "HH:MM:SS"

  return `${yyymmdd} ${hhmmss}`
}
