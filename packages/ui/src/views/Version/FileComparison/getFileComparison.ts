import { getFilePreviewSrc } from '../../../elements/Upload/getFilePreviewSrc.js'

export type VersionFile = {
  filename: string
  filesize: null | number
  height?: number
  mimeType: string
  /** The image to show. Each version's URLs include `?version=<id>`, so this is that version's file. */
  previewSrc: null | string
  url: string
  width?: number
}

export type FileComparison = {
  fileFrom: null | VersionFile
  fileTo: null | VersionFile
  hasChanged: boolean
}

/** A version's document data. Versions are typed as `object`, so fields are read with type checks. */
type VersionData = object | undefined

/**
 * Reads the file of each version for the top of the version comparison.
 * Returns null when there is nothing to show: neither version has a file, or the file did not
 * change and only modified fields are shown.
 */
export function getFileComparison({
  modifiedOnly,
  versionFromData,
  versionToData,
}: {
  modifiedOnly: boolean
  versionFromData: VersionData
  versionToData: VersionData
}): FileComparison | null {
  const fileFrom = getVersionFile({ versionData: versionFromData })
  const fileTo = getVersionFile({ versionData: versionToData })

  if (!fileFrom && !fileTo) {
    return null
  }

  const hasChanged = !isSameFile({ fileFrom, fileTo })

  if (modifiedOnly && !hasChanged) {
    return null
  }

  return { fileFrom, fileTo, hasChanged }
}

function getVersionFile({ versionData }: { versionData: VersionData }): null | VersionFile {
  const data = (versionData ?? {}) as Record<string, unknown>

  if (typeof data.filename !== 'string' || !data.filename) {
    return null
  }

  return {
    filename: data.filename,
    filesize: typeof data.filesize === 'number' ? data.filesize : null,
    height: typeof data.height === 'number' ? data.height : undefined,
    mimeType: typeof data.mimeType === 'string' ? data.mimeType : '',
    previewSrc: getFilePreviewSrc({ data }),
    url: typeof data.url === 'string' ? data.url : '',
    width: typeof data.width === 'number' ? data.width : undefined,
  }
}

/**
 * Compares the stored file details, not the URLs. Each version's URLs include its own version ID,
 * so they differ even when the file is the same.
 */
function isSameFile({
  fileFrom,
  fileTo,
}: {
  fileFrom: null | VersionFile
  fileTo: null | VersionFile
}): boolean {
  if (!fileFrom || !fileTo) {
    return false
  }

  return (
    fileFrom.filename === fileTo.filename &&
    fileFrom.filesize === fileTo.filesize &&
    fileFrom.mimeType === fileTo.mimeType &&
    fileFrom.width === fileTo.width &&
    fileFrom.height === fileTo.height
  )
}
