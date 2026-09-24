/**
 * Modules exported here are not part of the public API and are subject to change without notice and without a major version bump.
 */

export {
  type AdminContextCache,
  createAdminContext,
  type CreateAdminContextArgs,
  type PartialAdminContext,
} from '../admin/createAdminContext.js'
export { applyUserReadAccess } from '../auth/applyUserReadAccess.js'
export { createCLI } from '../cli/index.js'
export { getCommandInput } from '../cli/runtime/getCommandInput.js'
export { assertClientUploadAccess } from '../uploads/assertClientUploadAccess.js'
export { assertClientUploadAllowed } from '../uploads/assertClientUploadAllowed.js'
export {
  createClientUploadReceipt,
  verifyClientUploadReceipt,
} from '../uploads/clientUploadReceipt.js'
export { downloadFileToBuffer } from '../uploads/downloadFileToBuffer.js'
export { getUploadInstructions } from '../uploads/endpoints/uploadInstructions.js'
export { getFileFromUploadInstructions } from '../uploads/getFileFromUploadInstructions.js'
export { isXmlMimeType } from '../uploads/getFileTypeIdentity.js'
export { getRangeRequestInfo } from '../uploads/getRangeRequestInfo.js'
export { getSafeFileName } from '../uploads/getSafeFilename.js'
export { parseRangeHeader } from '../uploads/parseRangeHeader.js'
export { externalURLInputSchema, resolveURLUploadInput } from '../uploads/resolveURLUploadInput.js'
export type { ExternalURLInput } from '../uploads/resolveURLUploadInput.js'
export { uploadContentSecurityPolicy } from '../uploads/uploadContentSecurityPolicy.js'
export { getEntityPermissions } from '../utilities/getEntityPermissions/getEntityPermissions.js'
export { isURLAllowed } from '../utilities/isURLAllowed.js'
export { sanitizePermissions } from '../utilities/sanitizePermissions.js'
export { sendTelemetryEvent } from '../utilities/telemetry/index.js'
