export function isImage(mimeType: string): boolean {
  return (
    [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/svg+xml',
      'image/webp',
      'image/avif',
      'image/jxl',
    ].indexOf(mimeType) > -1
  )
}
