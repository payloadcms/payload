import type { TextFieldSingleValidation } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const validationCollectionSlug = 'validation-items'
export const validationFallbackCollectionSlug = 'validation-fallback-items'
export const validationGlobalSlug = 'validation-settings'
export const validationFallbackGlobalSlug = 'validation-fallback-settings'
export const validationDeniedGlobalSlug = 'validation-denied-settings'
export const validationDraftSourceGlobalSlug = 'validation-draft-source-settings'
export const validationAccessSourceGlobalSlug = 'validation-access-source-settings'
export const validationWhereCollectionSlug = 'validation-where-items'
export const validationWriteTargetGlobalSlug = 'validation-write-target-settings'
export const publishCollectionSlug = 'validation-publish-items'
export const publishGlobalSlug = 'validation-publish-settings'
export const writeTargetsSlug = 'validation-write-targets'
export const validationUploadsSlug = 'validation-uploads'
export const validationPublishUploadsSlug = 'validation-publish-uploads'
export const validationCustomButtonsCollectionSlug = 'validation-custom-buttons-items'
export const validationDeniedCollectionSlug = 'validation-denied-items'
export const validationNonLocalizedCollectionSlug = 'validation-non-localized-items'
export const validationAuthCollectionSlug = 'validation-auth-items'
export const validationCustomIDCollectionSlug = 'validation-custom-id-items'
export const validationEmptyCollectionSlug = 'validation-empty-items'
export const validationUniqueCollectionSlug = 'validation-unique-items'
export const validationUploadsDir = path.resolve(dirname, 'validation-uploads')
export const validationTempFilesDir = path.resolve(dirname, 'validation-temp-files')
export const validationPublishUploadsDir = path.resolve(dirname, 'validation-publish-uploads')

export const validateAfterReadPreviousValue: TextFieldSingleValidation = (
  _value,
  { operation, previousValue, req },
) => {
  if (
    operation === 'validate' &&
    req.context.requireAfterReadPreviousValue === true &&
    previousValue !== 'after-read:stored'
  ) {
    return 'Validation must use the after-read previous value'
  }

  return true
}
