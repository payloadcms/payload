/**
 * Takes image sizes and a target range and returns the url of the image within that range.
 * If no images fit within the range, it selects the next smallest adequate image, the original,
 * or the largest smaller image if no better fit exists.
 *
 * @param sizes The given FileSizes.
 * @param targetSizeMax The ideal image maximum width. Defaults to 180.
 * @param targetSizeMin The ideal image minimum width. Defaults to 40.
 * @param thumbnailURL The thumbnail url set in config. If passed a url, will return early with it.
 * @param url The url of the original file.
 * @param width The width of the original file.
 * @returns A url of the best fit file.
 */
export const getBestFitFromSizes = ({
  sizes,
  targetSizeMax = 180,
  targetSizeMin = 40,
  thumbnailURL,
  url,
  width,
}: {
  sizes?: Record<string, { url?: string; width?: number }>
  targetSizeMax?: number
  targetSizeMin?: number
  thumbnailURL?: string
  url: string
  width?: number
}) => {
  if (thumbnailURL) {
    return thumbnailURL
  }

  if (!sizes) {
    return url
  }

  const bestFit = Object.values(sizes).reduce<{
    original?: boolean
    url?: string
    width?: number
  }>(
    (closest, current) => {
      if (!current.width || current.width < targetSizeMin) {
        return closest
      }

      if (current.width >= targetSizeMin && current.width <= targetSizeMax) {
        return !closest.width ||
          current.width < closest.width ||
          closest.width < targetSizeMin ||
          closest.width > targetSizeMax
          ? current
          : closest
      }

      if (
        !closest.width ||
        (!closest.original && closest.width < targetSizeMin && current.width > closest.width) ||
        (closest.width > targetSizeMax && current.width < closest.width)
      ) {
        return current
      }

      return closest
    },
    { original: true, url, width },
  )

  return bestFit.url || url
}
