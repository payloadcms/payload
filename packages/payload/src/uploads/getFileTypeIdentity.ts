import sanitize from 'sanitize-filename'

import { sanitizeFilename } from '../utilities/sanitizeFilename.js'

export const getFileExtension = (filename: string): string => {
  if (!filename.includes('.')) {
    return ''
  }

  const extension = filename.split('.').pop() || ''
  const [extensionWithoutSuffix = ''] = extension.split(/[?#]/, 1)

  return extensionWithoutSuffix
}

export const getSanitizedUploadFilename = (filename: string, outputExtension?: string): string => {
  const basename = sanitizeFilename(filename)
  const sourceExtension = getFileExtension(basename)
  const baseFilename = sanitize(basename.substring(0, basename.lastIndexOf('.')) || basename)
  const extension = outputExtension ?? sourceExtension

  return `${baseFilename}${extension ? `.${extension}` : ''}`
}

export const getMimeTypeEssence = (mimeType?: null | string): string => {
  if (!mimeType) {
    return ''
  }

  const [essence = ''] = mimeType.split(';', 1)

  return essence.trim().toLowerCase()
}

export const isSvgMimeType = (mimeType?: null | string): boolean =>
  getMimeTypeEssence(mimeType) === 'image/svg+xml'

export const isXmlMimeType = (mimeType?: null | string): boolean => {
  const mimeTypeEssence = getMimeTypeEssence(mimeType)

  return (
    mimeTypeEssence === 'application/xml' ||
    mimeTypeEssence === 'text/xml' ||
    mimeTypeEssence.endsWith('+xml')
  )
}

export const isSvgUpload = ({
  filename,
  mimeType,
}: {
  filename: string
  mimeType?: null | string
}): boolean =>
  getFileExtension(getSanitizedUploadFilename(filename)).toLowerCase() === 'svg' ||
  isSvgMimeType(mimeType)

export const isXmlUpload = ({
  filename,
  mimeType,
}: {
  filename: string
  mimeType?: null | string
}): boolean =>
  getFileExtension(getSanitizedUploadFilename(filename)).toLowerCase() === 'xml' ||
  isXmlMimeType(mimeType)

export const uploadRequiresServerValidation = (upload: {
  allowRestrictedFileTypes?: boolean
  filename: string
  mimeType?: null | string
}): boolean => !upload.allowRestrictedFileTypes && (isSvgUpload(upload) || isXmlUpload(upload))
