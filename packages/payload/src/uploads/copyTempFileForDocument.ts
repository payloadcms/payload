import fs from 'fs/promises'
import { randomUUID } from 'node:crypto'
import path from 'node:path'

/**
 * Copies a temp file to `<name>-<uuid><ext>` next to it, for an operation that applies one
 * upload to many documents. Processing a document can change or remove its file, so each
 * document needs its own copy.
 */
export const copyTempFileForDocument = async ({
  tempFilePath,
}: {
  tempFilePath: string
}): Promise<string> => {
  const extension = path.extname(tempFilePath)
  const documentTempFilePath = path.join(
    path.dirname(tempFilePath),
    `${path.basename(tempFilePath, extension)}-${randomUUID()}${extension}`,
  )
  await fs.copyFile(tempFilePath, documentTempFilePath)

  return documentTempFilePath
}
