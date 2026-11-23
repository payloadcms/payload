import { PreviewSearchParams } from '@/app/(frontend)/next/preview/route'

export const generatePreviewPath = ({ path }: { path: null | string }) => {
  if (!path) {
    return null
  }

  const encodedParams = new URLSearchParams({
    path,
    previewSecret: process.env.PREVIEW_SECRET || '',
  } satisfies PreviewSearchParams)

  return `/next/preview?${encodedParams.toString()}`
}
