import { del } from '@vercel/blob'

import { generateURL } from './generateURL.js'

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
  const fileUrl = generateURL({
    baseUrl,
    collectionPrefix,
    filename,
    prefix: docPrefix,
    useCompositePrefixes,
  })

  await del(fileUrl, { token })
}
