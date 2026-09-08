import type { Payload } from 'payload'

import path from 'node:path'

export const getUploadDirectories = ({ payload }: { payload: Payload }): string[] => {
  const directories = payload.config.collections.flatMap((collection) => {
    if (
      !collection.upload ||
      collection.upload.disableLocalStorage ||
      !collection.upload.staticDir
    ) {
      return []
    }

    return [path.resolve(collection.upload.staticDir)]
  })

  return [...new Set(directories)]
}
