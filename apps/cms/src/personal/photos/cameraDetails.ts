import exifReader from 'exif-reader'
import sharp from 'sharp'

/** What the website shows under a photo, read from the EXIF data the camera wrote into the file */
export type CameraDetails = {
  camera?: {
    aperture?: string
    focalLength?: string
    iso?: string
    lens?: string
    model?: string
    shutterSpeed?: string
  }
  /**
   * The day it was taken, as an ISO date at noon UTC. Cameras record local time without a time
   * zone; noon keeps the day the same in the admin panel and on the website wherever they're used.
   */
  takenAt?: string
}

// Cameras pad some values with null characters
const text = (value: unknown) =>
  (typeof value === 'string' ? value.replace(/\0/g, '').trim() : '') || undefined

const positive = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined

/** "Canon" + "Canon EOS R5" -> "Canon EOS R5", "FUJIFILM" + "X-T5" -> "FUJIFILM X-T5" */
function cameraName(make?: string, model?: string) {
  if (!model) return make
  const brand = make?.split(/\s+/)[0]
  return brand && !model.toLowerCase().includes(brand.toLowerCase()) ? `${make} ${model}` : model
}

/** 0.004 -> "1/250 s", 2.5 -> "2.5 s" */
function shutterSpeed(seconds?: number) {
  if (!seconds) return undefined
  return seconds < 1 ? `1/${Math.round(1 / seconds)} s` : `${Number(seconds.toFixed(1))} s`
}

/**
 * The camera, lens, settings and capture date of a photo. Empty when the file has no EXIF data,
 * e.g. a screenshot or an image exported without metadata. Never throws.
 */
export async function readCameraDetails(image: Buffer): Promise<CameraDetails> {
  try {
    const { exif } = await sharp(image).metadata()
    if (!exif) return {}

    const { Image: device = {}, Photo: shot = {} } = exifReader(exif)
    const focalLength = positive(shot.FocalLength)
    const aperture = positive(shot.FNumber)
    const iso = positive(shot.ISOSpeedRatings)
    // exif-reader reads the camera's local time as UTC, so the UTC date is the local day
    const takenAt =
      shot.DateTimeOriginal instanceof Date && !Number.isNaN(shot.DateTimeOriginal.getTime())
        ? `${shot.DateTimeOriginal.toISOString().slice(0, 10)}T12:00:00.000Z`
        : undefined

    return {
      camera: {
        aperture: aperture ? `f/${Number(aperture.toFixed(1))}` : undefined,
        focalLength: focalLength ? `${Number(focalLength.toFixed(1))} mm` : undefined,
        iso: iso ? `ISO ${iso}` : undefined,
        lens: text(shot.LensModel),
        model: cameraName(text(device.Make), text(device.Model)),
        shutterSpeed: shutterSpeed(positive(shot.ExposureTime)),
      },
      takenAt,
    }
  } catch {
    return {}
  }
}
