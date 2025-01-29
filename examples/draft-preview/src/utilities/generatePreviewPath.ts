type Props = {
  collection: string
  slug: string
}

export const generatePreviewPath = ({ slug, collection }: Props) => {
  const path = `/${slug}`

  const encodedParams = new URLSearchParams({
    slug,
    collection,
    path,
    previewSecret: process.env.PREVIEW_SECRET,
  })

  return `/next/preview?${encodedParams.toString()}`
}
