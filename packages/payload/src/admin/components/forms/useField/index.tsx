import { useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import type { FieldType, Options } from './types'

import useThrottledEffect from '../../../hooks/useThrottledEffect'
import { useAuth } from '../../utilities/Auth'
import { useConfig } from '../../utilities/Config'
import { useDocumentInfo } from '../../utilities/DocumentInfo'
import { useOperation } from '../../utilities/OperationProvider'
import { useForm, useFormFields, useFormProcessing, useFormSubmitted } from '../Form/context'

/**
 * Get and set the value of a form field.
 *
 * @see https://payloadcms.com/docs/admin/hooks#usefield
 */
const useField = <T,>(options: Options): FieldType<T> => {
  const { condition, disableFormData = false, hasRows, path, validate } = options

  const submitted = useFormSubmitted()
  const processing = useFormProcessing()
  const { user } = useAuth()
  const { id } = useDocumentInfo()
  const operation = useOperation()
  const field = useFormFields(([fields]) => fields[path])
  const { t } = useTranslation()
  const dispatchField = useFormFields(([_, dispatch]) => dispatch)
  const config = useConfig()

  const { getData, getDataByPath, getSiblingData, setModified } = useForm()

  const value = field?.value as T
  const initialValue = field?.initialValue as T
  const valid = typeof field?.valid === 'boolean' ? field.valid : true
  const showError = valid === false && submitted

  const prevValid = useRef(valid)
  const prevErrorMessage = useRef(field?.errorMessage)
  const prevValue = useRef(value)

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
      rows: field?.rows,
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
        let valid: boolean | string = false

        const validationResult =
          typeof validate === 'function'
            ? await validate(valueToValidate, {
                id,
                config,
                data: getData(),
                operation,
                previousValue: prevValue.current,
                siblingData: getSiblingData(path),
                t,
                user,
              })
            : true

        if (typeof validationResult === 'string') {
          errorMessage = validationResult
          valid = false
        } else {
          valid = validationResult
          errorMessage = undefined
        }

        // Only dispatch if the validation result has changed
        // This will prevent unnecessary rerenders
        if (valid !== prevValid.current || errorMessage !== prevErrorMessage.current) {
          prevValid.current = valid
          prevErrorMessage.current = errorMessage

          if (typeof dispatchField === 'function') {
            dispatchField({
              type: 'UPDATE',
              condition,
              disableFormData:
                disableFormData || (hasRows ? typeof value === 'number' && value > 0 : false),
              errorMessage,
              path,
              previousValue: prevValue.current,
              rows: field?.rows,
              valid,
              validate,
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
      condition,
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
