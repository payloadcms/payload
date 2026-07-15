import exifr from 'exifr'

import type { ExtractedExif } from './types.js'

import { mapExif } from './mapExif.js'

export const extractExif = async ({
  buffer,
}: {
  buffer: Buffer
}): Promise<ExtractedExif | null> => {
  try {
    const raw = await exifr.parse(buffer, { gps: true })

    if (!raw) {
      return null
    }

    return mapExif(raw as Record<string, unknown>)
  } catch {
    return null
  }
}
