import type { CollectionBeforeChangeHook } from 'payload'

import { readFile } from 'node:fs/promises'

import type { ExtractedExif } from '../types.js'

import { extractExif as defaultExtract } from '../extractExif.js'

type Extractor = (args: { buffer: Buffer }) => Promise<ExtractedExif | null>

export const extractExifHook =
  ({
    extract = defaultExtract,
    fieldName,
  }: {
    extract?: Extractor
    fieldName: string
  }): CollectionBeforeChangeHook =>
  async ({ data, operation, req }) => {
    if (operation !== 'create' && operation !== 'update') {
      return data
    }

    const file = req.file

    if (!file) {
      return data
    }

    let buffer = file.data

    if ((!buffer || buffer.length === 0) && file.tempFilePath) {
      buffer = await readFile(file.tempFilePath)
    }

    if (!buffer || buffer.length === 0) {
      return data
    }

    const extracted = await extract({ buffer })

    if (!extracted) {
      return data
    }

    return {
      ...data,
      [fieldName]: {
        // point fields are [longitude, latitude]; null when either is missing.
        location:
          extracted.latitude !== null && extracted.longitude !== null
            ? [extracted.longitude, extracted.latitude]
            : null,
        raw: extracted.raw,
        takenAt: extracted.takenAt,
      },
    }
  }
