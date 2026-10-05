import type { Sharp, SharpOptions } from 'sharp'

import { getUploadFilePath } from 'payload/internal'

import type { SharpDependency } from './types.js'

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

  return sharpDependency(Buffer.from(await file.arrayBuffer()), options)
}
