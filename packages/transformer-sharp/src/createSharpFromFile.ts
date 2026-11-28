import type { Sharp, SharpOptions } from 'sharp'

import { getUploadFilePath } from 'payload/internal'

import type { SharpDependency } from './types.js'

/**
 * Caps the pixels Sharp may decode from a source, via `limitInputPixels`. An
 * explicit `limitInputPixels` in the caller's options wins over the
 * transformer's cap — it is the more specific choice — so the cap only fills
 * in what the caller left unset. Without a cap, Sharp decodes up to its own
 * 268 MP default, which a few-kilobyte flat-colour image can reach.
 */
export function withInputPixelLimit({
  maxInputPixels,
  options,
}: {
  maxInputPixels: number | undefined
  options: SharpOptions | undefined
}): SharpOptions | undefined {
  if (maxInputPixels === undefined) {
    return options
  }

  return { limitInputPixels: maxInputPixels, ...options }
}

/**
 * One upload can open the same in-memory source many times (metadata probes plus
 * every variant, some concurrently). Sharing one buffer per File avoids a fresh
 * full-size copy on each open.
 */
const inMemorySourceBuffers = new WeakMap<File, Promise<Buffer>>()

export async function createSharpFromFile({
  file,
  maxInputPixels,
  options,
  sharpDependency,
}: {
  file: File
  maxInputPixels?: number
  options?: SharpOptions
  sharpDependency: SharpDependency
}): Promise<Sharp> {
  const sharpOptions = withInputPixelLimit({ maxInputPixels, options })
  const filePath = getUploadFilePath(file)
  if (filePath) {
    return sharpOptions && Object.keys(sharpOptions).length > 0
      ? sharpDependency(filePath, sharpOptions)
      : sharpDependency(filePath)
  }

  return sharpDependency(await getInMemorySourceBuffer({ file }), sharpOptions)
}

function getInMemorySourceBuffer({ file }: { file: File }): Promise<Buffer> {
  const cachedBuffer = inMemorySourceBuffers.get(file)
  if (cachedBuffer) {
    return cachedBuffer
  }

  const buffer = file.arrayBuffer().then((arrayBuffer) => Buffer.from(arrayBuffer))
  inMemorySourceBuffers.set(file, buffer)
  buffer.catch(() => {
    if (inMemorySourceBuffers.get(file) === buffer) {
      inMemorySourceBuffers.delete(file)
    }
  })

  return buffer
}
