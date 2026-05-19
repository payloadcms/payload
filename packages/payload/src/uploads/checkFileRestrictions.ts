import { fileTypeFromBuffer, fileTypeFromFile } from 'file-type'
import fs from 'fs/promises'

import type { checkFileRestrictionsParams, FileAllowList } from './types.js'

import { ValidationError } from '../errors/index.js'
import { validateMimeType } from '../utilities/validateMimeType.js'
import { validatePDF } from '../utilities/validatePDF.js'
import { detectSvgFromXml } from './detectSvgFromXml.js'
import { getFileTypeFallback } from './getFileTypeFallback.js'
import { validateSvg } from './validateSvg.js'

/**
 * Restricted file types and their extensions.
 */
export const RESTRICTED_FILE_EXT_AND_TYPES: FileAllowList = [
  { extensions: ['exe', 'dll'], mimeType: 'application/x-msdownload' },
  { extensions: ['exe', 'com', 'app', 'action'], mimeType: 'application/x-executable' },
  { extensions: ['bat', 'cmd'], mimeType: 'application/x-msdos-program' },
  { extensions: ['exe', 'com'], mimeType: 'application/x-ms-dos-executable' },
  { extensions: ['dmg'], mimeType: 'application/x-apple-diskimage' },
  { extensions: ['deb'], mimeType: 'application/x-debian-package' },
  { extensions: ['rpm'], mimeType: 'application/x-redhat-package-manager' },
  { extensions: ['exe', 'dll'], mimeType: 'application/vnd.microsoft.portable-executable' },
  { extensions: ['msi'], mimeType: 'application/x-msi' },
  { extensions: ['jar', 'ear', 'war'], mimeType: 'application/java-archive' },
  { extensions: ['desktop'], mimeType: 'application/x-desktop' },
  { extensions: ['cpl'], mimeType: 'application/x-cpl' },
  { extensions: ['lnk'], mimeType: 'application/x-ms-shortcut' },
  { extensions: ['pkg'], mimeType: 'application/x-apple-installer' },
  { extensions: ['htm', 'html', 'shtml', 'xhtml'], mimeType: 'text/html' },
  { extensions: ['php', 'phtml'], mimeType: 'application/x-httpd-php' },
  { extensions: ['js', 'jse'], mimeType: 'text/javascript' },
  { extensions: ['jsp'], mimeType: 'application/x-jsp' },
  { extensions: ['py'], mimeType: 'text/x-python' },
  { extensions: ['rb'], mimeType: 'text/x-ruby' },
  { extensions: ['pl'], mimeType: 'text/x-perl' },
  { extensions: ['ps1', 'psc1', 'psd1', 'psh', 'psm1'], mimeType: 'application/x-powershell' },
  { extensions: ['vbe', 'vbs'], mimeType: 'application/x-vbscript' },
  { extensions: ['ws', 'wsc', 'wsf', 'wsh'], mimeType: 'application/x-ms-wsh' },
  { extensions: ['scr'], mimeType: 'application/x-msdownload' },
  { extensions: ['asp', 'aspx'], mimeType: 'application/x-asp' },
  { extensions: ['hta'], mimeType: 'application/x-hta' },
  { extensions: ['reg'], mimeType: 'application/x-registry' },
  { extensions: ['url'], mimeType: 'application/x-url' },
  { extensions: ['workflow'], mimeType: 'application/x-workflow' },
  { extensions: ['command'], mimeType: 'application/x-command' },
]

export const checkFileRestrictions = async ({
  collection,
  file,
  req,
}: checkFileRestrictionsParams): Promise<void> => {
  const errors: string[] = []
  const { upload: uploadConfig } = collection
  const configMimeTypes =
    uploadConfig &&
    typeof uploadConfig === 'object' &&
    'mimeTypes' in uploadConfig &&
    Array.isArray(uploadConfig.mimeTypes)
      ? uploadConfig.mimeTypes
      : []

  const allowRestrictedFileTypes =
    uploadConfig && typeof uploadConfig === 'object' && 'allowRestrictedFileTypes' in uploadConfig
      ? (uploadConfig as { allowRestrictedFileTypes?: boolean }).allowRestrictedFileTypes
      : false

  const expectsDetectableType = (mimeType: string): boolean => {
    const textBasedTypes = ['/svg', 'image/svg+xml', 'image/x-xbitmap', 'image/x-xpixmap']

    if (textBasedTypes.includes(mimeType)) {
      return false
    }

    return (
      mimeType.startsWith('image/') ||
      mimeType.startsWith('video/') ||
      mimeType.startsWith('audio/') ||
      mimeType === 'application/pdf'
    )
  }

  // Skip validation if `allowRestrictedFileTypes` is true
  if (allowRestrictedFileTypes) {
    return
  }

  // For temp files, use fileTypeFromFile so large files (e.g. video) are never loaded into memory
  // just for detection. For content validation (SVG safety, PDF integrity), the full buffer is
  // loaded lazily and only when the file type actually requires it.
  const { tempFilePath } = file
  const isTempFile = !!tempFilePath && (!file.data || file.data.length === 0)

  // Lazily reads the full file — only reached for small text-based types (SVG, PDF).
  let _fileBuffer: Buffer | undefined
  const getFileBuffer = async (): Promise<Buffer> => {
    if (_fileBuffer) {
      return _fileBuffer
    }
    if (!isTempFile || !tempFilePath) {
      return (_fileBuffer = file.data)
    }
    try {
      _fileBuffer = await fs.readFile(tempFilePath)
      return _fileBuffer
    } catch {
      throw new ValidationError({
        errors: [{ message: 'Could not read uploaded file for validation.', path: 'file' }],
      })
    }
  }

  // Secondary mimetype check to assess file type from buffer
  if (configMimeTypes.length > 0) {
    let detected
    try {
      detected =
        isTempFile && tempFilePath
          ? await fileTypeFromFile(tempFilePath)
          : await fileTypeFromBuffer(file.data)
    } catch {
      throw new ValidationError({
        errors: [{ message: 'Could not read uploaded file for type detection.', path: 'file' }],
      })
    }
    const typeFromExtension = file.name.split('.').pop() || ''

    // Handle SVG files that are detected as XML due to <?xml declarations
    if (
      detected?.mime === 'application/xml' &&
      configMimeTypes.some(
        (type) => type.includes('image/') && (type.includes('svg') || type === 'image/*'),
      )
    ) {
      const isSvg = detectSvgFromXml(await getFileBuffer())
      if (isSvg) {
        detected = { ext: 'svg', mime: 'image/svg+xml' }
      }
    }

    if (!detected) {
      const mimeTypeFromExtension = getFileTypeFallback(file.name).mime
      const extIsValid = validateMimeType(mimeTypeFromExtension, configMimeTypes)

      if (!extIsValid) {
        errors.push(
          `File type ${mimeTypeFromExtension} (from extension ${typeFromExtension}) is not allowed.`,
        )
      } else {
        // SVG security check (text-based files not detectable by buffer)
        if (typeFromExtension.toLowerCase() === 'svg') {
          const isSafeSvg = validateSvg(await getFileBuffer())
          if (!isSafeSvg) {
            errors.push('SVG file contains potentially harmful content.')
          }
        }

        // PDF validation
        if (mimeTypeFromExtension === 'application/pdf') {
          const isValidPDF = validatePDF(await getFileBuffer())
          if (!isValidPDF) {
            errors.push('Invalid or corrupted PDF file.')
          }
        }
      }

      if (expectsDetectableType(mimeTypeFromExtension)) {
        req.payload.logger.warn(
          `File buffer returned no detectable MIME type for ${file.name}. Falling back to extension-based validation.`,
        )
      }
    }

    const passesMimeTypeCheck = detected?.mime && validateMimeType(detected.mime, configMimeTypes)

    if (passesMimeTypeCheck && detected?.mime === 'application/pdf') {
      const isValidPDF = validatePDF(await getFileBuffer())
      if (!isValidPDF) {
        errors.push('Invalid PDF file.')
      }
    }

    if (detected && !passesMimeTypeCheck) {
      errors.push(`Invalid MIME type: ${detected.mime}.`)
    }
  } else {
    const isRestricted = RESTRICTED_FILE_EXT_AND_TYPES.some((type) => {
      const hasRestrictedExt = type.extensions.some((ext) => file.name.toLowerCase().endsWith(ext))
      const hasRestrictedMime = type.mimeType === file.mimetype
      return hasRestrictedExt || hasRestrictedMime
    })
    if (isRestricted) {
      errors.push(
        `File type '${file.mimetype}' not allowed ${file.name}: Restricted file type detected -- set 'allowRestrictedFileTypes' to true to skip this check for this Collection.`,
      )
    }
  }

  if (errors.length > 0) {
    req.payload.logger.error(errors.join(', '))
    throw new ValidationError({
      errors: [{ message: errors.join(', '), path: 'file' }],
    })
  }
}
