import path from 'path'

export const getMimeType = (
  filePath: string,
): {
  filename: string
  type: string
} => {
  const ext = path.extname(filePath).slice(1)
  let type: string
  switch (ext) {
    case 'png':
      type = 'image/png'
      break
    case 'jpg':
      type = 'image/jpeg'
      break
    case 'jpeg':
      type = 'image/jpeg'
      break
    case 'svg':
      type = 'image/svg+xml'
      break
    case 'webp':
      type = 'image/webp'
      break
    default:
      type = 'image/png'
  }

  return {
    filename: path.basename(filePath),
    type,
  }
}
