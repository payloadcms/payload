export function canResizeImage(mimeType: string): boolean {
  return (
    ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/tiff', 'image/avif'].indexOf(
      mimeType,
    ) > -1
  )
}
