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
    case 'jpeg':
      type = 'image/jpeg'
      break
    case 'jpg':
      type = 'image/jpeg'
      break
    case 'mp3':
      type = 'audio/mpeg'
      break
    case 'mp4':
      type = 'video/mp4'
      break
    case 'pdf':
      type = 'application/pdf'
      break
    case 'png':
      type = 'image/png'
      break
    case 'svg':
      type = 'image/svg+xml'
      break
    case 'txt':
      type = 'text/plain'
      break
    case 'webp':
      type = 'image/webp'
      break
    default:
      type = 'application/octet-stream'
  }

  return {
    filename: path.basename(filePath),
    type,
  }
}
