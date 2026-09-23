import type {
  CloudinaryCropMode,
  CloudinaryDynamicDefaults,
  CloudinaryImageSizeOptions,
  CloudinaryTransformation,
  FocalPoint,
} from './types.js'

/**
 * Chooses the Cloudinary crop mode that reproduces Sharp's resize semantics.
 *
 * Sharp fills the exact box when both dimensions are given and preserves the aspect
 * ratio when only one is; `withoutEnlargement` additionally forbids upscaling. Cloudinary
 * spells those four combinations as distinct crop modes rather than as a flag.
 */
export function resolveCropMode({
  fillMode,
  hasHeight,
  hasWidth,
  withoutEnlargement,
}: {
  /** Crop mode to use when both dimensions are given and upscaling is allowed. */
  fillMode: CloudinaryCropMode
  hasHeight: boolean
  hasWidth: boolean
  withoutEnlargement: boolean
}): CloudinaryCropMode {
  const hasBothDimensions = hasWidth && hasHeight

  if (!withoutEnlargement) {
    return hasBothDimensions ? fillMode : 'scale'
  }

  return hasBothDimensions ? 'lfill' : 'limit'
}

/**
 * Builds the transformation for a dynamic (request-time) variant from the parsed
 * query parameters and this transformer instance's configured defaults.
 */
export function buildDynamicTransformation({
  defaults,
  height,
  width,
  withoutEnlargement,
}: {
  defaults: { format?: CloudinaryDynamicDefaults['format'] } & Required<
    Omit<CloudinaryDynamicDefaults, 'format'>
  >
  height?: number
  width?: number
  withoutEnlargement?: boolean
}): CloudinaryTransformation {
  return {
    crop: resolveCropMode({
      fillMode: defaults.crop,
      hasHeight: height !== undefined,
      hasWidth: width !== undefined,
      withoutEnlargement: withoutEnlargement ?? defaults.withoutEnlargement,
    }),
    fetchFormat: defaults.format,
    gravity: defaults.gravity,
    height,
    quality: defaults.quality,
    width,
  }
}

/**
 * Builds the transformation for one configured `imageSizes` entry.
 *
 * A focal point is expressed as Cloudinary's `g_xy_center` with the focus translated
 * from percentages into source pixels, which is how Cloudinary anchors a crop to a point.
 */
export function buildImageSizeTransformation({
  focalPoint,
  originalDimensions,
  size,
}: {
  focalPoint?: FocalPoint
  originalDimensions: { height: number; width: number }
  size: CloudinaryImageSizeOptions
}): CloudinaryTransformation {
  const crop =
    size.crop ??
    resolveCropMode({
      fillMode: 'fill',
      hasHeight: size.height !== undefined,
      hasWidth: size.width !== undefined,
      withoutEnlargement:
        size.withoutEnlargement === false ? false : Boolean(size.withoutEnlargement),
    })

  const transformation: CloudinaryTransformation = {
    crop,
    fetchFormat: size.formatOptions?.format,
    gravity: size.gravity,
    height: size.height,
    quality: size.formatOptions?.quality,
    width: size.width,
  }

  if (focalPoint && !size.gravity) {
    transformation.gravity = 'center'
    transformation.x = Math.round((focalPoint.x / 100) * originalDimensions.width)
    transformation.y = Math.round((focalPoint.y / 100) * originalDimensions.height)
  }

  return transformation
}

/**
 * Builds the transformation for the main uploaded file: an Admin-selected crop
 * rectangle first, then the collection's configured resize and format settings.
 *
 * Cloudinary applies a chained transformation left to right, so the crop has to be
 * its own step - a single step cannot both extract a rectangle and rescale the result.
 */
export function buildMainTransformationChain({
  crop,
  formatOptions,
  resizeOptions,
}: {
  crop?: {
    heightInPixels: number
    originalDimensions: { height: number; width: number }
    widthInPixels: number
    x: number
    y: number
  }
  formatOptions?: {
    format?: CloudinaryTransformation['fetchFormat']
    quality?: CloudinaryTransformation['quality']
  }
  resizeOptions?: Omit<CloudinaryTransformation, 'x' | 'y'>
}): CloudinaryTransformation[] {
  const chain: CloudinaryTransformation[] = []

  if (crop) {
    chain.push({
      crop: 'crop',
      height: crop.heightInPixels,
      width: crop.widthInPixels,
      x: crop.x,
      y: crop.y,
    })
  }

  if (resizeOptions && (resizeOptions.width !== undefined || resizeOptions.height !== undefined)) {
    chain.push({
      ...resizeOptions,
      crop:
        resizeOptions.crop ??
        resolveCropMode({
          fillMode: 'fill',
          hasHeight: resizeOptions.height !== undefined,
          hasWidth: resizeOptions.width !== undefined,
          withoutEnlargement: false,
        }),
    })
  }

  if (formatOptions?.format || formatOptions?.quality) {
    chain.push({ fetchFormat: formatOptions.format, quality: formatOptions.quality })
  }

  return chain
}

/**
 * Crop modes that actually consult gravity. Sending `g_` with any other mode is
 * ignored by Cloudinary but still changes the delivery URL, which needlessly
 * fragments its derived-asset cache.
 */
const GRAVITY_AWARE_CROP_MODES = new Set(['crop', 'fill', 'lfill', 'pad', 'thumb'])

/**
 * Maps this package's transformation shape onto the Cloudinary SDK's option names,
 * dropping unset keys so they never reach a delivery URL as empty components.
 */
export function toCloudinaryOptions(
  transformation: CloudinaryTransformation,
): Record<string, number | string> {
  const usesGravity = !transformation.crop || GRAVITY_AWARE_CROP_MODES.has(transformation.crop)
  // An explicit focal point is anchored with `xy_center`, which consumes `x`/`y`.
  const gravity = transformation.x !== undefined ? 'xy_center' : transformation.gravity

  const mapped: Record<string, number | string | undefined> = {
    crop: transformation.crop,
    fetch_format: transformation.fetchFormat,
    gravity: usesGravity ? gravity : undefined,
    height: transformation.height,
    quality: transformation.quality,
    width: transformation.width,
    x: usesGravity ? transformation.x : undefined,
    y: usesGravity ? transformation.y : undefined,
  }

  return Object.fromEntries(
    Object.entries(mapped).filter(([, value]) => value !== undefined),
  ) as Record<string, number | string>
}
