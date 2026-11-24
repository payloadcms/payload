import type { FormState, ValidationFieldError } from 'payload'

import { dequal } from 'dequal/lite'
import { getDataByPath } from 'payload/shared'

export type SubmissionErrors = {
  /** Errors from one rejected submission, pruned as their fields change. */
  errors: ValidationFieldError[]
  /** Submitted values and row identities used to match errors to the current form. */
  fields: FormState
  /** Remains true across field edits; resets and unmounting end the submission's session. */
  isActive: () => boolean
}

export const getMatchingFieldErrors = ({
  currentFields,
  errors,
  submittedFields,
}: {
  currentFields: FormState
  errors: ValidationFieldError[]
  submittedFields: FormState
}): ValidationFieldError[] =>
  errors.filter(({ path }) => {
    const submittedField = submittedFields[path]
    const currentField = currentFields[path]

    if (!submittedField || !currentField || currentField.passesCondition === false) {
      return false
    }

    const segments = path.split('.')

    for (let index = 1; index < segments.length; index++) {
      const parentPath = segments.slice(0, index).join('.')
      const submittedRows = submittedFields[parentPath]?.rows
      const currentRows = currentFields[parentPath]?.rows

      if (Array.isArray(submittedRows) || Array.isArray(currentRows)) {
        const rowIndex = Number(segments[index])
        const submittedRow = submittedRows?.[rowIndex]
        const currentRow = currentRows?.[rowIndex]

        if (!submittedRow || !currentRow || submittedRow.id !== currentRow.id) {
          return false
        }
      }
    }

    const submittedValue = Array.isArray(submittedField.rows)
      ? getDataByPath(submittedFields, path)
      : submittedField.value
    const currentValue = Array.isArray(currentField.rows)
      ? getDataByPath(currentFields, path)
      : currentField.value

    return dequal(submittedValue, currentValue)
  })
