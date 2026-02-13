export const generateImageSrcWithCacheTag = ({
  cacheTag,
  src,
}: {
  cacheTag?: string
  src: string
}): string => {
  if (!src) {
    return ''
  }
  if (!cacheTag) {
    return src
  }

  return src.includes('?')
    ? `${src}&${encodeURIComponent(cacheTag)}`
    : `${src}?${encodeURIComponent(cacheTag)}`
}
