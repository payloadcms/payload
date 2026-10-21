// Matches the formats sharp's own `animated` input option documents as supported (reading every
// frame/page instead of just the first): https://sharp.pixelplumbing.com/api-constructor - "Set to
// true to read all frames/pages of an animated image (GIF, WebP, TIFF)". AVIF is deliberately
// excluded even though the format itself supports animation: this sharp version's AVIF encoder
// silently flattens `join({ animated: true })` frames into a single tall static image instead of
// a multi-page sequence (verified directly - the output always comes back as `pages: 1`), so
// there's no working animated-AVIF path to account for here.
const ANIMATED_IMAGE_MIME_TYPES = ['image/gif', 'image/tiff', 'image/webp']

/**
 * Whether sharp needs to read every frame/page of this mime type (rather than just the first) to
 * process it correctly - used to decide whether a file needs its full bytes fetched/processed
 * even without any resize/format/trim adjustments configured, and whether sharp should be asked
 * to read all frames when it does run.
 */
export function isAnimatedImage(mimeType: string): boolean {
  return ANIMATED_IMAGE_MIME_TYPES.includes(mimeType)
}
