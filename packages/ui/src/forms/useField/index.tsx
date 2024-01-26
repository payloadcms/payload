'use client'
import { useCallback, useMemo, useRef } from 'react'
import { useTranslation } from '../../providers/Translation'

import type { FieldType, Options } from './types'

import useThrottledEffect from '../../hooks/useThrottledEffect'
import { useAuth } from '../../providers/Auth'
import { useConfig } from '../../providers/Config'
import { useDocumentInfo } from '../../providers/DocumentInfo'
import { useOperation } from '../../providers/OperationProvider'
import { useForm, useFormFields, useFormProcessing, useFormSubmitted } from '../Form/context'
import { useFieldPath } from '../FieldPathProvider'

/**
 * Get and set the value of a form field.
 *
 * @see https://payloadcms.com/docs/admin/hooks#usefield
 */
const useField = <T,>(options: Options): FieldType<T> => {
  const { disableFormData = false, hasRows, validate } = options

  const pathFromContext = useFieldPath()

  const path = options.path || pathFromContext

  const submitted = useFormSubmitted()
  const processing = useFormProcessing()
  const { user } = useAuth()
  const { id } = useDocumentInfo()
  const operation = useOperation()
  const { field, dispatchField } = useFormFields(([fields, dispatch]) => ({
    field: fields[path],
    dispatchField: dispatch,
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
        disableFormData: disableFormData || (hasRows && val > 0),
        path,
        type: 'UPDATE',
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
      rows: field?.rows,
      setValue,
      showError,
      valid: field?.valid,
      value,
      path,
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

          if (typeof dispatchField === 'function') {
            dispatchField({
              disableFormData:
                disableFormData || (hasRows ? typeof value === 'number' && value > 0 : false),
              errorMessage,
              path,
              rows: field?.rows,
              type: 'UPDATE',
              valid,
              // validate,
              value,
            })
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

export default useField
