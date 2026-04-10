import { del } from '@vercel/blob'
import path from 'path'

interface DeleteFileArgs {
  baseUrl: string
  filename: string
  prefix: string
  token: string
}

export async function deleteFile({
  baseUrl,
  filename,
  prefix,
  token,
}: DeleteFileArgs): Promise<void> {
  const fileUrl = `${baseUrl}/${path.posix.join(prefix, filename)}`
  await del(fileUrl, { token })
}
