import type { ExtractedExif } from './types.js'

export const mapExif = (raw: Record<string, unknown>): ExtractedExif => {
  const takenAtValue = raw.DateTimeOriginal ?? raw.CreateDate ?? raw.ModifyDate

  return {
    latitude: typeof raw.latitude === 'number' ? raw.latitude : null,
    longitude: typeof raw.longitude === 'number' ? raw.longitude : null,
    raw,
    takenAt:
      takenAtValue instanceof Date
        ? takenAtValue.toISOString()
        : typeof takenAtValue === 'string'
          ? takenAtValue
          : null,
  }
}
