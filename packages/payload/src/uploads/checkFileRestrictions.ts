import { fileTypeFromBuffer } from 'file-type'

import type { checkFileRestrictionsParams } from './types.js'

import { APIError } from '../errors/index.js'
/**
 * Restricted file types and their extensions.
 */
export const RESTRICTED_FILE_EXT_AND_TYPES = [
  { extensions: ['exe', 'dll'], fileType: 'application/x-msdownload' },
  { extensions: ['exe', 'com', 'app', 'action'], fileType: 'application/x-executable' },
  { extensions: ['bat', 'cmd'], fileType: 'application/x-msdos-program' },
  { extensions: ['exe', 'com'], fileType: 'application/x-ms-dos-executable' },
  { extensions: ['dmg'], fileType: 'application/x-apple-diskimage' },
  { extensions: ['deb'], fileType: 'application/x-debian-package' },
  { extensions: ['rpm'], fileType: 'application/x-redhat-package-manager' },
  { extensions: ['exe', 'dll'], fileType: 'application/vnd.microsoft.portable-executable' },
  { extensions: ['msi'], fileType: 'application/x-msi' },
  { extensions: ['jar', 'ear', 'war'], fileType: 'application/java-archive' },
  { extensions: ['desktop'], fileType: 'application/x-desktop' },
  { extensions: ['cpl'], fileType: 'application/x-cpl' },
  { extensions: ['lnk'], fileType: 'application/x-ms-shortcut' },
  { extensions: ['pkg'], fileType: 'application/x-apple-installer' },
  { extensions: ['htm', 'html', 'shtml', 'xhtml'], fileType: 'text/html' },
  { extensions: ['php', 'phtml'], fileType: 'application/x-httpd-php' },
  { extensions: ['js', 'jse'], fileType: 'text/javascript' },
  { extensions: ['jsp'], fileType: 'application/x-jsp' },
  { extensions: ['py'], fileType: 'text/x-python' },
  { extensions: ['rb'], fileType: 'text/x-ruby' },
  { extensions: ['pl'], fileType: 'text/x-perl' },
  { extensions: ['ps1', 'psc1', 'psd1', 'psh', 'psm1'], fileType: 'application/x-powershell' },
  { extensions: ['vbe', 'vbs'], fileType: 'application/x-vbscript' },
  { extensions: ['ws', 'wsc', 'wsf', 'wsh'], fileType: 'application/x-ms-wsh' },
  { extensions: ['scr'], fileType: 'application/x-msdownload' },
  { extensions: ['asp', 'aspx'], fileType: 'application/x-asp' },
  { extensions: ['hta'], fileType: 'application/x-hta' },
  { extensions: ['reg'], fileType: 'application/x-registry' },
  { extensions: ['url'], fileType: 'application/x-url' },
  { extensions: ['workflow'], fileType: 'application/x-workflow' },
  { extensions: ['command'], fileType: 'application/x-command' },
]

export const checkFileRestrictions = async ({
  collection,
  file,
  req,
}: checkFileRestrictionsParams): Promise<void> => {
  const { upload: uploadConfig } = collection
  const configMimeTypes =
    uploadConfig &&
    typeof uploadConfig === 'object' &&
    'mimeTypes' in uploadConfig &&
    Array.isArray(uploadConfig.mimeTypes)
      ? uploadConfig.mimeTypes
      : []

  const restrictedFileTypes =
    uploadConfig && typeof uploadConfig === 'object' && 'restrictedFileTypes' in uploadConfig
      ? (uploadConfig as { restrictedFileTypes?: boolean }).restrictedFileTypes
      : false

  // Skip validation if `mimeTypes` are defined in the upload config, or `restrictedFileTypes` are allowed
  if (restrictedFileTypes || configMimeTypes.length) {
    return
  }

  const detectedFileType = await fileTypeFromBuffer(file.data)
  const detectedFileMime = detectedFileType ? detectedFileType.mime : file.mimetype

  const isRestrictedExt = RESTRICTED_FILE_EXT_AND_TYPES.some((type) =>
    type.extensions.some((ext) => file.name.toLowerCase().endsWith(ext)),
  )
  const isRestrictedMime = RESTRICTED_FILE_EXT_AND_TYPES.some(
    (type) => type.fileType === detectedFileMime,
  )

  if (isRestrictedMime) {
    req.payload.logger.error(
      `File validation failed for ${file.name}: Restricted file type detected`,
    )
    throw new APIError(`File validation failed for ${file.name}: Restricted file type detected`)
  }

  if (isRestrictedExt) {
    req.payload.logger.error(
      `File validation failed for ${file.name}: Restricted file extension detected`,
    )
    throw new APIError(
      `File validation failed for ${file.name}: Restricted file extension detected`,
    )
  }
}
