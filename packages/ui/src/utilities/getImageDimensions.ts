type ImageDimensions = {
  height?: number
  width?: number
}

/**
 * Reads the natural pixel dimensions of an image File in the browser.
 *
 * Used during client uploads so the server can record dimensions without fetching the
 * file bytes back. Returns empty dimensions for non-images or when decoding fails, in
 * which case the server falls back to probing the bytes itself.
 */
export async function getImageDimensions(file: File): Promise<ImageDimensions> {
  if (typeof window === 'undefined' || !file.type?.startsWith('image/')) {
    return {}
  }

  const objectURL = URL.createObjectURL(file)

  try {
    const { height, width } = await new Promise<ImageDimensions>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve({ height: image.naturalHeight, width: image.naturalWidth })
      image.onerror = reject
      image.src = objectURL
    })

    // Some formats (e.g. SVG without intrinsic size) report 0 — treat as unknown.
    if (!height || !width) {
      return {}
    }

    return { height, width }
  } catch {
    return {}
  } finally {
    URL.revokeObjectURL(objectURL)
  }
}
