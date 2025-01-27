export default function canResizeImage(mimeType: string): boolean {
  return ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/tiff'].indexOf(mimeType) > -1
}
