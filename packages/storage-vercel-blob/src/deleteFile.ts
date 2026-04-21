import { getFileKey } from '@payloadcms/plugin-cloud-storage/utilities'
import { del } from '@vercel/blob'

interface DeleteFileArgs {
  baseUrl: string
  collectionPrefix?: string
  docPrefix: string
  filename: string
  token: string
  useCompositePrefixes?: boolean
}

export async function deleteFile({
  baseUrl,
  collectionPrefix = '',
  docPrefix,
  filename,
  token,
  useCompositePrefixes = false,
}: DeleteFileArgs): Promise<void> {
  const fileKey = getFileKey({
    collectionPrefix,
    docPrefix,
    filename,
    useCompositePrefixes,
  })

  const fileUrl = `${baseUrl}/${fileKey}`

  await del(fileUrl, { token })
}
