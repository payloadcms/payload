import type { Config } from '../config/types.js'

type GenerateFileURLArgs = {
  apiRoute: NonNullable<Config['routes']>['api']
  collectionSlug: string
  filename?: string
  serverURL: Config['serverURL']
}
export const generateFileURL = ({
  apiRoute,
  collectionSlug,
  filename,
  serverURL,
}: GenerateFileURLArgs) => {
  if (filename) {
    return `${serverURL || ''}${apiRoute || ''}/${collectionSlug}/file/${encodeURIComponent(filename)}`
  }
  return undefined
}
