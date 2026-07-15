import type { ExtractedExif } from './types.js'

import { mapExif } from './mapExif.js'

// exifr eagerly loads Node built-ins (`fs`, `zlib`) at module init for its file
// reader and PNG inflate. A static import pulls that into the server/admin config
// module graph, which Next re-evaluates per request in dev — causing repeated
// "Couldn't load fs/zlib" warnings. Loading exifr lazily (and memoizing it) keeps
// it out of that graph so it only initializes when an upload triggers extraction.
type ExifrLike = {
  parse: (data: Buffer, options?: unknown) => Promise<null | Record<string, unknown> | undefined>
}

let exifrPromise: Promise<ExifrLike> | undefined

const loadExifr = async (): Promise<ExifrLike> => {
  if (!exifrPromise) {
    exifrPromise = import('exifr').then((mod) => mod.default as unknown as ExifrLike)
  }

  return exifrPromise
}

export const extractExif = async ({
  buffer,
}: {
  buffer: Buffer
}): Promise<ExtractedExif | null> => {
  try {
    const exifr = await loadExifr()
    const raw = await exifr.parse(buffer, { gps: true })

    if (!raw) {
      return null
    }

    return mapExif(raw)
  } catch {
    return null
  }
}
