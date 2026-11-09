const mimeTypesByExtension: Record<string, string> = {
  avif: 'image/avif',
  flac: 'audio/flac',
  gif: 'image/gif',
  heic: 'image/heic',
  heif: 'image/heif',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  m4a: 'audio/mp4',
  m4v: 'video/x-m4v',
  mkv: 'video/x-matroska',
  mov: 'video/quicktime',
  mp3: 'audio/mpeg',
  mp4: 'video/mp4',
  ogg: 'audio/ogg',
  pdf: 'application/pdf',
  png: 'image/png',
  wav: 'audio/wav',
  webm: 'video/webm',
  webp: 'image/webp',
}

/**
 * Browsers report `''` or `application/octet-stream` for files they can't identify, which depends
 * on the platform. Upload instructions need a real type: collections with `mimeTypes` refuse anything
 * else, and it becomes the object's `Content-Type`, so this fills it in from the extension. It only labels the upload. The
 * file's content is still checked against the collection when the document is saved.
 */
export const resolveUploadFile = (file: File): File => {
  if (file.type !== '' && file.type !== 'application/octet-stream') {
    return file
  }

  const extension = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() : undefined
  const type = extension ? mimeTypesByExtension[extension] : undefined

  return type ? new File([file], file.name, { type, lastModified: file.lastModified }) : file
}
