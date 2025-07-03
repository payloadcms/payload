import type { checkFileRestrictionsParams, FileAllowList } from './types.js'

import { APIError } from '../errors/index.js'

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

export const checkFileRestrictions = ({
  collection,
  file,
  req,
}: checkFileRestrictionsParams): void => {
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

  // Skip validation if `mimeTypes` are defined in the upload config, or `allowRestrictedFileTypes` are allowed
  if (allowRestrictedFileTypes || configMimeTypes.length) {
    return
  }

  const isRestricted = RESTRICTED_FILE_EXT_AND_TYPES.some((type) => {
    const hasRestrictedExt = type.extensions.some((ext) => file.name.toLowerCase().endsWith(ext))
    const hasRestrictedMime = type.mimeType === file.mimetype
    return hasRestrictedExt || hasRestrictedMime
  })

  if (isRestricted) {
    const errorMessage = `File type '${file.mimetype}' not allowed ${file.name}: Restricted file type detected -- set 'allowRestrictedFileTypes' to true to skip this check for this Collection.`
    req.payload.logger.error(errorMessage)
    throw new APIError(errorMessage)
  }
}
