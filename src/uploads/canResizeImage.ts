export default function canResizeImage(mimeType: string): boolean {
  return ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].indexOf(mimeType) > -1;
}
