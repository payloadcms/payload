'use client'
import { useCallback, useMemo, useRef } from 'react'

import type { UPDATE } from '../Form/types.js'
import type { FieldType, Options } from './types.js'

import useThrottledEffect from '../../hooks/useThrottledEffect.js'
import { useAuth } from '../../providers/Auth/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useOperation } from '../../providers/OperationProvider/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { useFieldProps } from '../FieldPropsProvider/index.js'
import { useForm, useFormFields, useFormProcessing, useFormSubmitted } from '../Form/context.js'

/**
 * Get and set the value of a form field.
 *
 * @see https://payloadcms.com/docs/admin/hooks#usefield
 */
export const useField = <T,>(options: Options): FieldType<T> => {
  const { disableFormData = false, hasRows, validate } = options

  const { path: pathFromContext, permissions, readOnly, schemaPath } = useFieldProps()

  const path = options.path || pathFromContext

  const submitted = useFormSubmitted()
  const processing = useFormProcessing()
  const { user } = useAuth()
  const { id } = useDocumentInfo()
  const operation = useOperation()

  const { dispatchField, field } = useFormFields(([fields, dispatch]) => ({
    dispatchField: dispatch,
    field: (fields && fields?.[path]) || null,
  }))

  const { t } = useTranslation()
  const config = useConfig()

  const { getData, getDataByPath, getSiblingData, setModified } = useForm()

  const value = field?.value as T
  const initialValue = field?.initialValue as T
  const valid = typeof field?.valid === 'boolean' ? field.valid : true
  const showError = valid === false && submitted

  const prevValid = useRef(valid)

  // Method to return from `useField`, used to
  // update field values from field component(s)
  const setValue = useCallback(
    (e, disableModifyingForm = false) => {
      const val = e && e.target ? e.target.value : e

      if (!disableModifyingForm) {
        if (typeof setModified === 'function') {
          // Update modified state after field value comes back
          // to avoid cursor jump caused by state value / DOM mismatch
          setTimeout(() => {
            setModified(true)
          }, 10)
        }
      }

      dispatchField({
        type: 'UPDATE',
        disableFormData: disableFormData || (hasRows && val > 0),
        path,
        value: val,
      })
    },
    [setModified, path, dispatchField, disableFormData, hasRows],
  )

  // Store result from hook as ref
  // to prevent unnecessary rerenders
  const result: FieldType<T> = useMemo(
    () => ({
      errorMessage: field?.errorMessage,
      formProcessing: processing,
      formSubmitted: submitted,
      initialValue,
      path,
      permissions,
      readOnly: readOnly || false,
      rows: field?.rows,
      schemaPath,
      setValue,
      showError,
      valid: field?.valid,
      value,
    }),
    [
      field?.errorMessage,
      field?.rows,
      field?.valid,
      processing,
      setValue,
      showError,
      submitted,
      value,
      initialValue,
      path,
      schemaPath,
      readOnly,
      permissions,
    ],
  )

  // Throttle the validate function
  useThrottledEffect(
    () => {
      const validateField = async () => {
        let valueToValidate = value

        if (field?.rows && Array.isArray(field.rows)) {
          valueToValidate = getDataByPath(path)
        }

        let errorMessage: string | undefined
        let valid: boolean | string = prevValid.current

        const isValid =
          typeof validate === 'function'
            ? await validate(valueToValidate, {
                id,
                config,
                data: getData(),
                operation,
                siblingData: getSiblingData(path),
                t,
                user,
              })
            : true

        if (typeof isValid === 'string') {
          valid = false
          errorMessage = isValid
        } else if (typeof isValid === 'boolean') {
          valid = isValid
          errorMessage = undefined
        }

        // Only dispatch if the validation result has changed
        // This will prevent unnecessary rerenders
        if (valid !== prevValid.current) {
          prevValid.current = valid

          const update: UPDATE = {
            type: 'UPDATE',
            errorMessage,
            path,
            rows: field?.rows,
            valid,
            // validate,
            value,
          }

          if (disableFormData || (hasRows ? typeof value === 'number' && value > 0 : false)) {
            update.disableFormData = true
          }

          if (typeof dispatchField === 'function') {
            dispatchField(update)
          }
        }
      }

      void validateField()
    },
    150,
    [
      value,
      disableFormData,
      dispatchField,
      getData,
      getSiblingData,
      getDataByPath,
      id,
      operation,
      path,
      user,
      validate,
      field?.rows,
    ],
  )

  return result
}
