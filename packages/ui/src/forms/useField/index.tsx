'use client'
import type { PayloadRequest } from 'payload'

import React, { useCallback, useMemo, useRef } from 'react'

import type { UPDATE } from '../Form/types.js'
import type { FieldType, Options } from './types.js'

export type { FieldType, Options }

import { useThrottledEffect } from '../../hooks/useThrottledEffect.js'
import { useAuth } from '../../providers/Auth/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useOperation } from '../../providers/Operation/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import {
  useDocumentForm,
  useForm,
  useFormFields,
  useFormInitializing,
  useFormProcessing,
  useFormSubmitted,
} from '../Form/context.js'
import { useFieldPath } from '../RenderFields/context.js'

const useFieldInForm = <TValue,>(options?: Options): FieldType<TValue> => {
  const {
    disableFormData = false,
    hasRows,
    path: pathFromOptions,
    potentiallyStalePath,
    validate,
  } = options || {}

  const pathFromContext = useFieldPath()

  // This is a workaround for stale props given to server rendered components.
  // See the notes in the `potentiallyStalePath` type definition for more details.
  const path = pathFromOptions || pathFromContext || potentiallyStalePath

  const submitted = useFormSubmitted()
  const processing = useFormProcessing()
  const initializing = useFormInitializing()
  const { user } = useAuth()
  const { id, collectionSlug } = useDocumentInfo()
  const operation = useOperation()

  const dispatchField = useFormFields(([_, dispatch]) => dispatch)
  const field = useFormFields(([fields]) => (fields && fields?.[path]) || null)

  const { t } = useTranslation()
  const { config } = useConfig()

  const { getData, getDataByPath, getSiblingData, setModified } = useForm()
  const documentForm = useDocumentForm()

  const filterOptions = field?.filterOptions
  const value = field?.value as TValue
  const initialValue = field?.initialValue as TValue
  const valid = typeof field?.valid === 'boolean' ? field.valid : true
  const showError = valid === false && submitted

  const prevValid = useRef(valid)
  const prevErrorMessage = useRef(field?.errorMessage)

  const pathSegments = path ? path.split('.') : []

  // Method to return from `useField`, used to
  // update field values from field component(s)
  const setValue = useCallback(
    (e, disableModifyingForm = false) => {
      // TODO:
      // There are no built-in fields that pass events into `e`.
      // Remove this check in the next major version.
      const isEvent =
        e &&
        typeof e === 'object' &&
        typeof e.preventDefault === 'function' &&
        typeof e.stopPropagation === 'function'

      const val = isEvent ? e.target.value : e

      dispatchField({
        type: 'UPDATE',
        disableFormData: disableFormData || (hasRows && val > 0),
        path,
        value: val,
      })

      if (!disableModifyingForm) {
        setModified(true)
      }
    },
    [setModified, path, dispatchField, disableFormData, hasRows],
  )

  // Store result from hook as ref
  // to prevent unnecessary rerenders
  const result: FieldType<TValue> = useMemo(
    () => ({
      blocksFilterOptions: field?.blocksFilterOptions,
      customComponents: field?.customComponents,
      disabled: processing || initializing,
      errorMessage: field?.errorMessage,
      errorPaths: field?.errorPaths || [],
      filterOptions,
      formInitializing: initializing,
      formProcessing: processing,
      formSubmitted: submitted,
      initialValue,
      path,
      rows: field?.rows,
      selectFilterOptions: field?.selectFilterOptions,
      setValue,
      showError,
      valid: field?.valid,
      value,
    }),
    [
      field,
      processing,
      setValue,
      showError,
      submitted,
      value,
      initialValue,
      path,
      filterOptions,
      initializing,
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

        let errorMessage: string | undefined = prevErrorMessage.current
        let valid: boolean | string = prevValid.current

        const data = getData()
        const isValid =
          typeof validate === 'function'
            ? await validate(valueToValidate, {
                id,
                blockData: undefined, // Will be expensive to get - not worth to pass to client-side validation, as this can be obtained by the user using `useFormFields()`
                collectionSlug,
                data: documentForm?.getData ? documentForm.getData() : data,
                event: 'onChange',
                operation,
                path: pathSegments,
                preferences: {} as any,
                req: {
                  payload: {
                    config,
                  },
                  t,
                  user,
                } as unknown as PayloadRequest,
                siblingData: getSiblingData(path),
              })
            : typeof prevErrorMessage.current === 'string'
              ? prevErrorMessage.current
              : prevValid.current

        if (typeof isValid === 'string') {
          valid = false
          errorMessage = isValid
        } else if (typeof isValid === 'boolean') {
          valid = isValid
          errorMessage = undefined
        }

        // Only dispatch if the validation result has changed
        // This will prevent unnecessary rerenders
        if (valid !== prevValid.current || errorMessage !== prevErrorMessage.current) {
          prevValid.current = valid
          prevErrorMessage.current = errorMessage

          const update: UPDATE = {
            type: 'UPDATE',
            errorMessage,
            path,
            rows: field?.rows,
            valid,
            validate,
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
      collectionSlug,
    ],
  )

  return result
}

/**
 * Context to allow providing useField value for fields directly, if managed outside the Form
 *
 * @experimental
 */
export const FieldContext = React.createContext<FieldType<unknown> | undefined>(undefined)

/**
 * Get and set the value of a form field.
 *
 * @see https://payloadcms.com/docs/admin/react-hooks#usefield
 */
export const useField = <TValue,>(options?: Options): FieldType<TValue> => {
  const pathFromContext = useFieldPath()

  const fieldContext = React.use(FieldContext) as FieldType<TValue> | undefined

  // Lock the mode on first render so hook order is stable forever. This ensures
  // that hooks are called in the same order each time a component renders => should
  // not break the rule of hooks.
  const hasFieldContext = React.useRef<false | null | true>(null)
  if (hasFieldContext.current === null) {
    // Use field context, if a field context exists **and** the path matches. If the path
    // does not match, this could be the field context of a parent field => there likely is
    // a nested <Form /> we should use instead => 'form'
    const currentPath = options?.path || pathFromContext || options?.potentiallyStalePath

    hasFieldContext.current =
      fieldContext && currentPath && fieldContext.path === currentPath ? true : false
  }

  if (hasFieldContext.current === true) {
    if (!fieldContext) {
      // Provider was removed after mount. That violates hook guarantees.
      throw new Error('FieldContext was removed after mount. This breaks hook ordering.')
    }
    return fieldContext
  }

  // We intentionally guard this hook call with a mode that is fixed on first render.
  // The order is consistent across renders. Silence the linter’s false positive.

  // eslint-disable-next-line react-compiler/react-compiler
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useFieldInForm<TValue>(options)
}
