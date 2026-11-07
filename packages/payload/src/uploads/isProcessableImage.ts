import { canResizeImage } from './canResizeImage.js'
import { isImage } from './isImage.js'
import { getMimeTypeEssence } from './isMediaMimeType.js'

export function isProcessableImage(mimeType: string): boolean {
  // Compare on the MIME essence (type/subtype, lowercased) so parameterized or
  // mixed-case image declarations such as `image/png;charset=utf-8` or
  // `IMAGE/PNG` are still treated as processable, keeping dimension probing and
  // image processing working when the caller keeps its original declaration.
  const essence = getMimeTypeEssence(mimeType)
  return isImage(essence) || canResizeImage(essence)
}
