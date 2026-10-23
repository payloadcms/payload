/**
 * Modules exported here are not part of the public API and are subject to change without notice and without a major version bump.
 */

export { applyUserReadAccess } from '../auth/applyUserReadAccess.js'
export { createSchemaBuildContext } from '../database/createSchemaBuildContext.js'
export type { SchemaBuildContext } from '../database/createSchemaBuildContext.js'
export { assertClientUploadAccess } from '../uploads/assertClientUploadAccess.js'
export {
  assertClientUploadAllowed,
  assertClientUploadFileSize,
} from '../uploads/assertClientUploadAllowed.js'
export {
  createClientUploadReceipt,
  verifyClientUploadReceipt,
} from '../uploads/clientUploadReceipt.js'
export type {
  ClientUploadReceipt,
  SignedClientUploadReceipt,
} from '../uploads/clientUploadReceipt.js'
export {
  bindLegacyFileSource,
  deleteTempFile,
  getFileBlob,
  getFileBuffer,
  getFileBufferOrPath,
  getFileInspectionInput,
  getFileSize,
  getFileSource,
  getFileStream,
  replaceFileSource,
  writeFileToDisk,
} from '../uploads/fileSource.js'
export type { FileSource, FileSourceToSave } from '../uploads/fileSource.js'
export { getExternalFile } from '../uploads/getExternalFile.js'
export { isSvgMimeType, isXmlMimeType } from '../uploads/getFileTypeIdentity.js'
export { getRangeRequestInfo } from '../uploads/getRangeRequestInfo.js'
export { getSafeFileName } from '../uploads/getSafeFilename.js'
export { parseRangeHeader } from '../uploads/parseRangeHeader.js'
export { UPLOAD_CONTENT_SECURITY_POLICY } from '../uploads/uploadContentSecurityPolicy.js'
export { toRequestFile, toUploadFile } from '../uploads/uploadFile.js'
export type { UploadFile } from '../uploads/uploadFile.js'
export { getEntityPermissions } from '../utilities/getEntityPermissions/getEntityPermissions.js'

export { sanitizePermissions } from '../utilities/sanitizePermissions.js'
