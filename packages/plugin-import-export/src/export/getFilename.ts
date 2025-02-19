export const getFilename = () => {
  const [yyymmdd = '', hhmmss = ''] = new Date().toISOString().split('T')
  const formattedDate = yyymmdd.replace(/\D/g, '')
  const formattedTime = (hhmmss.split('.')[0] ?? '').replace(/\D/g, '')

  return `${formattedDate}_${formattedTime}`
}
