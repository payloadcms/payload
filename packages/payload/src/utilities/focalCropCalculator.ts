/**
 * payloadcms/payload - image-thumbnail-aspect-ratio-crop
 */
export function calcFocalCrop(w: number, h: number, fx: number, fy: number) { return { x: fx * w, y: fy * h }; }
