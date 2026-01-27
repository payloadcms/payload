import type { CollectionBeforeChangeHook, FileData, TypeWithID } from 'payload'

import { ValidationError } from 'payload'
import { validateMimeType } from 'payload/shared'

import type { FormBuilderPluginConfig, SubmissionValue, UploadField } from '../../../types.js'

type BeforeChangeParams = Parameters<CollectionBeforeChangeHook>[0]

interface UploadError {
  field: string
  message: string
}

/**
 * Handles upload fields in form submissions.
 *
 * This hook:
 * 1. Checks req.files for files matching upload field names
 * 2. Validates MIME types and file sizes before uploading
 * 3. Creates media documents in the appropriate upload collection
 * 4. Updates submissionData with the created file IDs
 * 5. Validates pre-uploaded file IDs for backwards compatibility
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

  // Build a map of submission values for easy lookup
  const submissionMap = new Map<string, { index: number; value: unknown }>()
  const submissionDataArray = submissionData as SubmissionValue[]

  for (let i = 0; i < submissionDataArray.length; i++) {
    const item = submissionDataArray[i]

    if (item) {
      submissionMap.set(item.field, { index: i, value: item.value })
    }
  }

  // Get files from request (populated by addDataAndFileToRequest)
  // Type assertion needed as `files` is added to PayloadRequest for multipart form handling
  const requestFiles =
    (
      req as {
        files?: Record<string, { data: Buffer; mimetype: string; name: string; size: number }>
      }
    ).files || {}

  const errors: UploadError[] = []
  const updatedSubmissionData = [...submissionDataArray]

  for (const uploadField of uploadFields) {
    const { name, maxFileSize, mimeTypes, multiple, required, uploadCollection } = uploadField
    const fieldLabel = uploadField.label || name

    // Check if there's a file in the request for this field
    const requestFile = requestFiles[name]
    const existingSubmission = submissionMap.get(name)

    // Handle direct file upload from request
    if (requestFile) {
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

      // Create the media document
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

        // Update or add the submission data entry with the file ID
        const fileId = String(mediaDoc.id)

        if (existingSubmission) {
          // If multiple files and there's already a value, append
          if (multiple && existingSubmission.value) {
            updatedSubmissionData[existingSubmission.index] = {
              field: name,
              value: `${existingSubmission.value},${fileId}`,
            }
          } else {
            updatedSubmissionData[existingSubmission.index] = {
              field: name,
              value: fileId,
            }
          }
        } else {
          // Add new submission entry
          updatedSubmissionData.push({
            field: name,
            value: fileId,
          })
          // Update the map for potential subsequent iterations
          submissionMap.set(name, { index: updatedSubmissionData.length - 1, value: fileId })
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'

        errors.push({
          field: name,
          message: `${fieldLabel}: Failed to upload file - ${errorMessage}`,
        })
        continue
      }
    } else if (existingSubmission && existingSubmission.value) {
      // Backwards compatibility: validate pre-uploaded file IDs
      const submittedValue = existingSubmission.value

      // Parse file IDs (comma-separated for multiple files)
      const fileIds = multiple
        ? String(submittedValue)
            .split(',')
            .map((id) => id.trim())
            .filter(Boolean)
        : [String(submittedValue)]

      // Validate each file
      for (const fileId of fileIds) {
        let fileDoc: (FileData & TypeWithID) | null = null

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
          continue
        }

        if (!fileDoc) {
          errors.push({
            field: name,
            message: `${fieldLabel}: File with ID "${fileId}" not found`,
          })
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
          }
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
    throw new ValidationError({
      collection: formConfig?.formSubmissionOverrides?.slug || 'form-submissions',
      errors: errors.map((error) => ({
        message: error.message,
        path: error.field,
      })),
    })
  }

  // Return updated data with new submission data
  return {
    ...data,
    submissionData: updatedSubmissionData,
  }
}
