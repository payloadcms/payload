import type {
  CollectionBeforeChangeHook,
  File,
  FileData,
  TypeWithID,
  UploadCollectionSlug,
} from 'payload'

import { ValidationError } from 'payload'
import { validateMimeType } from 'payload/shared'

import type {
  FormBuilderPluginConfig,
  SubmissionUploadItem,
  SubmissionValue,
  UploadField,
} from '../../../types.js'

type BeforeChangeParams = Parameters<CollectionBeforeChangeHook>[0]

interface UploadError {
  field: string
  message: string
}

/**
 * Handles upload fields in form submissions.
 *
 * This hook:
 * 1. Checks req.files for files matching upload field names (supports multiple files per field)
 * 2. Validates MIME types and file sizes before uploading
 * 3. Creates media documents in the appropriate upload collection
 * 4. Populates submissionUploads with proper Payload upload relationships
 * 5. Strips upload fields from submissionData (they live in submissionUploads only)
 * 6. Validates pre-uploaded file IDs for backwards compatibility
 */
export const handleUploads = async (
  beforeChangeParams: BeforeChangeParams,
  formConfig: FormBuilderPluginConfig,
) => {
  const { data, operation, req } = beforeChangeParams
  const { payload } = req

  // Only handle on create
  if (operation !== 'create') {
    return data
  }

  const { form: formID, submissionData } = data || {}

  if (!formID || !submissionData) {
    return data
  }

  const formSlug = formConfig?.formOverrides?.slug || 'forms'

  // Fetch the form to get field configurations
  let form
  try {
    form = await payload.findByID({
      id: formID,
      collection: formSlug,
      req,
    })
  } catch {
    // If form doesn't exist, let the form relationship validation handle it
    return data
  }

  const formFields = form?.fields || []
  const uploadFields = formFields.filter(
    (field: { blockType: string }) => field.blockType === 'upload',
  ) as UploadField[]

  if (uploadFields.length === 0) {
    return data
  }

  const submissionDataArray = submissionData as SubmissionValue[]

  // Build a map of pre-uploaded file IDs for backwards-compat lookup
  const submissionMap = new Map<string, { index: number; value: unknown }>()
  for (let i = 0; i < submissionDataArray.length; i++) {
    const item = submissionDataArray[i]
    if (item) {
      submissionMap.set(item.field, { index: i, value: item.value })
    }
  }

  // Get files from request (populated by addDataAndFileToRequest).
  // Multiple files with the same field name are stored as an array by buildFields.
  const requestFiles = req.files || {}

  const errors: UploadError[] = []
  // Accumulate upload items per field — one entry per upload field in the form
  const uploadsByField = new Map<string, SubmissionUploadItem[]>()
  // Track docs created during this hook so we can delete them if a later error causes rollback
  const createdDocs: Array<{ collection: string; id: number | string }> = []

  for (const uploadField of uploadFields) {
    const { name, maxFileSize, mimeTypes, multiple, required, uploadCollection } = uploadField
    const fieldLabel = uploadField.label || name

    uploadsByField.set(name, [])

    // Validate uploadCollection is configured in this plugin (defence-in-depth against tampered form docs)
    if (!formConfig.uploadCollections?.includes(uploadCollection)) {
      errors.push({
        field: name,
        message: `Upload collection "${uploadCollection}" is not configured in this plugin`,
      })
      continue
    }

    // Normalize: multiple files with the same field name arrive as an array
    const rawFile = requestFiles[name]
    const requestFileList: File[] = rawFile ? (Array.isArray(rawFile) ? rawFile : [rawFile]) : []

    const existingSubmission = submissionMap.get(name)

    if (requestFileList.length > 0) {
      // Guard: reject multiple files when the field doesn't allow them
      if (!multiple && requestFileList.length > 1) {
        errors.push({
          field: name,
          message: `${fieldLabel} does not allow multiple files`,
        })
        continue
      }

      // Direct file upload(s) from request
      for (const requestFile of requestFileList) {
        // Validate MIME type before uploading
        if (mimeTypes && mimeTypes.length > 0) {
          const allowedPatterns = mimeTypes.map((m) => m.mimeType)

          if (!validateMimeType(requestFile.mimetype, allowedPatterns)) {
            errors.push({
              field: name,
              message: `${fieldLabel}: File type "${requestFile.mimetype}" is not allowed. Allowed types: ${allowedPatterns.join(', ')}`,
            })
            continue
          }
        }

        // Validate file size before uploading
        if (maxFileSize && maxFileSize > 0 && requestFile.size > maxFileSize) {
          const maxSizeMB = (maxFileSize / (1024 * 1024)).toFixed(2)
          const fileSizeMB = (requestFile.size / (1024 * 1024)).toFixed(2)

          errors.push({
            field: name,
            message: `${fieldLabel}: File size (${fileSizeMB}MB) exceeds maximum allowed size (${maxSizeMB}MB)`,
          })
          continue
        }

        // Create the media document.
        // Note: payload.create writes the file to storage before the DB row exists. If
        // the DB write throws, createdDocs never records the entry and the file on disk
        // will not be cleaned up by the rollback loop below. Payload core owns that
        // rollback path — we only clean up docs we successfully created here.
        try {
          const mediaDoc = await payload.create({
            collection: uploadCollection,
            data: {},
            file: {
              name: requestFile.name,
              data: requestFile.data,
              mimetype: requestFile.mimetype,
              size: requestFile.size,
            },
            req,
          })

          createdDocs.push({ id: mediaDoc.id, collection: uploadCollection })
          uploadsByField.get(name)!.push({ relationTo: uploadCollection, value: mediaDoc.id })
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error'

          errors.push({
            field: name,
            message: `${fieldLabel}: Failed to upload file - ${errorMessage}`,
          })
        }
      }
    } else if (existingSubmission && existingSubmission.value) {
      // Backwards compatibility: validate pre-uploaded file IDs
      const submittedValue = existingSubmission.value
      const submittedValueStr =
        typeof submittedValue === 'string' || typeof submittedValue === 'number'
          ? String(submittedValue)
          : ''

      if (!submittedValueStr) {
        if (required) {
          errors.push({ field: name, message: `${fieldLabel} is required` })
        }
        continue
      }

      // Guard: reject comma-separated IDs when the field doesn't allow multiple files.
      // Assumes IDs never contain literal commas — true for ObjectIDs/UUIDs and any numeric ID.
      if (!multiple && submittedValueStr.includes(',')) {
        errors.push({
          field: name,
          message: `${fieldLabel} does not allow multiple files`,
        })
        continue
      }

      // Parse file IDs (comma-separated for multiple files)
      const fileIds = multiple
        ? submittedValueStr
            .split(',')
            .map((id) => id.trim())
            .filter(Boolean)
        : [submittedValueStr]

      // Validate each file
      for (const fileId of fileIds) {
        let fileDoc: (FileData & TypeWithID) | null = null
        let fileIsValid = true

        try {
          fileDoc = (await payload.findByID({
            id: fileId,
            collection: uploadCollection,
            req,
          })) as FileData & TypeWithID
        } catch {
          errors.push({
            field: name,
            message: `${fieldLabel}: File with ID "${fileId}" not found in collection "${uploadCollection}"`,
          })
          fileIsValid = false
          continue
        }

        if (!fileDoc) {
          errors.push({
            field: name,
            message: `${fieldLabel}: File with ID "${fileId}" not found`,
          })
          fileIsValid = false
          continue
        }

        // Validate mimeType
        if (mimeTypes && mimeTypes.length > 0) {
          const allowedPatterns = mimeTypes.map((m) => m.mimeType)
          const fileMimeType = fileDoc.mimeType

          if (fileMimeType && !validateMimeType(fileMimeType, allowedPatterns)) {
            errors.push({
              field: name,
              message: `${fieldLabel}: File type "${fileMimeType}" is not allowed. Allowed types: ${allowedPatterns.join(', ')}`,
            })
            fileIsValid = false
            continue
          }
        }

        // Validate file size
        if (maxFileSize && maxFileSize > 0) {
          const fileSize = fileDoc.filesize

          if (fileSize && fileSize > maxFileSize) {
            const maxSizeMB = (maxFileSize / (1024 * 1024)).toFixed(2)
            const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2)

            errors.push({
              field: name,
              message: `${fieldLabel}: File size (${fileSizeMB}MB) exceeds maximum allowed size (${maxSizeMB}MB)`,
            })
            fileIsValid = false
          }
        }

        if (fileIsValid) {
          uploadsByField.get(name)!.push({ relationTo: uploadCollection, value: fileDoc.id })
        }
      }
    } else if (required) {
      // No file in request and no pre-uploaded file ID, but field is required
      errors.push({
        field: name,
        message: `${fieldLabel} is required`,
      })
    }
  }

  if (errors.length > 0) {
    // Best-effort cleanup of any docs created before the error was detected
    for (const doc of createdDocs) {
      try {
        await payload.delete({ id: doc.id, collection: doc.collection, req })
      } catch {
        // best-effort — don't mask the original validation error
      }
    }

    throw new ValidationError({
      collection: formConfig?.formSubmissionOverrides?.slug || 'form-submissions',
      errors: errors.map((error) => ({
        message: error.message,
        path: error.field,
      })),
    })
  }

  // Strip upload fields from submissionData — they are stored in submissionUploads only
  const uploadFieldNames = new Set(uploadFields.map((f) => f.name))
  const cleanedSubmissionData = submissionDataArray.filter(
    (item) => !uploadFieldNames.has(item.field),
  )

  // One entry per upload field; omit fields with no successful uploads
  const updatedSubmissionUploads = Array.from(uploadsByField.entries())
    .filter(([, items]) => items.length > 0)
    .map(([field, value]) => ({ field, value }))

  return {
    ...data,
    submissionData: cleanedSubmissionData,
    submissionUploads: updatedSubmissionUploads,
  }
}
