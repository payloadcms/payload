import type { Sharp, SharpOptions } from 'sharp'

import { getUploadFilePath } from 'payload/internal'

import type { SharpDependency } from './types.js'

/**
 * One upload can open the same in-memory source many times (metadata probes plus
 * every variant, some concurrently). Sharing one buffer per File avoids a fresh
 * full-size copy on each open.
 */
const inMemorySourceBuffers = new WeakMap<File, Promise<Buffer>>()

export async function createSharpFromFile({
  file,
  options,
  sharpDependency,
}: {
  file: File
  options?: SharpOptions
  sharpDependency: SharpDependency
}): Promise<Sharp> {
  const filePath = getUploadFilePath(file)
  if (filePath) {
    return options && Object.keys(options).length > 0
      ? sharpDependency(filePath, options)
      : sharpDependency(filePath)
  }

  return sharpDependency(await getInMemorySourceBuffer({ file }), options)
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
