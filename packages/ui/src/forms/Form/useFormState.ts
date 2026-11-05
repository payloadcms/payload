'use client'

import type { FormState, PayloadRequest } from 'payload'
import type { Dispatch, RefObject } from 'react'

import { dequal } from 'dequal/lite'
import { useCallback, useEffect, useReducer, useRef, useState } from 'react'

import type { FieldAction, Context as FormContextType, FormProps } from './types.js'

import { useAuth } from '../../providers/Auth/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useOperation } from '../../providers/Operation/index.js'
import { useServerFunctions } from '../../providers/ServerFunctions/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { abortAndIgnore, handleAbortRef } from '../../utilities/abortAndIgnore.js'
import { useDocumentForm } from './context.js'
import { fieldReducer } from './fieldReducer.js'
import { initContextState } from './initContextState.js'

export type UseFormStateResult = {
  dispatchFields: Dispatch<FieldAction>
  formState: FormState
  isModified: boolean
  isValid: boolean
  prevFormStateRef: RefObject<FormState>
  resetFormState: FormContextType['reset']
  setIsValid: FormContextType['setIsValid']
  setModified: FormContextType['setModified']
  validateForm: FormContextType['validateForm']
}

type Args = {
  contextRef: RefObject<FormContextType>
  props: Pick<FormProps, 'initialState'>
}

/**
 * Maintains Form's fields, validation, reset method, and modified status.
 *
 * @example
 * const { formState, dispatchFields, resetFormState } = useFormState(args)
 *
 * dispatchFields({ type: 'UPDATE', path: 'title', value: 'Updated title' })
 * await resetFormState(data)
 */
export const useFormState = ({ contextRef, props }: Args): UseFormStateResult => {
  const { id, collectionSlug, docPermissions, getDocPreferences, globalSlug } = useDocumentInfo()
  const documentForm = useDocumentForm()
  const currentLocale = useLocale()
  const locale = currentLocale?.code
  const { t } = useTranslation()
  const { user } = useAuth()
  const operation = useOperation()
  const { getFormState } = useServerFunctions()
  const { config } = useConfig()

  const [isValid, setIsValid] = useState(true)
  const [isModified, setModified] = useState(false)

  const abortResetFormRef = useRef<AbortController>(null)

  const [formState, dispatchFields] = useReducer(fieldReducer, {}, () => props.initialState)

  contextRef.current.fields = formState

  const prevFormStateRef = useRef(formState)

  const validateForm = useCallback(async () => {
    const validatedFieldState: FormState = {}
    let isValid = true

    const data = contextRef.current.getData()

    const validationPromises = Object.entries(contextRef.current.fields).map(
      async ([path, field]) => {
        const validatedField = field
        const pathSegments = path ? path.split('.') : []

        if (field.passesCondition !== false) {
          let validationResult: boolean | string = validatedField.valid

          if ('validate' in field && typeof field.validate === 'function') {
            let valueToValidate = field.value

            if (field?.rows && Array.isArray(field.rows)) {
              valueToValidate = contextRef.current.getDataByPath(path)
            }

            validationResult = await field.validate(valueToValidate, {
              ...field,
              id,
              collectionSlug,
              // Client-side validation can read block data through useFormFields.
              blockData: undefined,
              data: documentForm?.getData ? documentForm.getData() : data,
              event: 'submit',
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
              siblingData: contextRef.current.getSiblingData(path),
            })

            if (typeof validationResult === 'string') {
              validatedField.errorMessage = validationResult
              validatedField.valid = false
            } else {
              validatedField.valid = true
              validatedField.errorMessage = undefined
            }
          }

          if (validatedField.valid === false) {
            isValid = false
          }
        }

        validatedFieldState[path] = validatedField
      },
    )

    await Promise.all(validationPromises)

    if (!dequal(contextRef.current.fields, validatedFieldState)) {
      dispatchFields({ type: 'REPLACE_STATE', state: validatedFieldState })
    }

    setIsValid(isValid)

    return isValid
  }, [collectionSlug, config, contextRef, dispatchFields, id, operation, t, user, documentForm])

  const resetFormState = useCallback<FormContextType['reset']>(
    async (data) => {
      const controller = handleAbortRef(abortResetFormRef)

      const docPreferences = await getDocPreferences()

      const { state: newState } = await getFormState({
        id,
        collectionSlug,
        data,
        docPermissions,
        docPreferences,
        globalSlug,
        locale,
        operation,
        renderAllFields: true,
        schemaPath: collectionSlug ? collectionSlug : globalSlug,
        signal: controller.signal,
        skipValidation: true,
      })

      const setModified = contextRef.current.setModified

      contextRef.current = { ...initContextState, disabled: contextRef.current.disabled }
      setModified(false)
      dispatchFields({ type: 'REPLACE_STATE', state: newState })

      abortResetFormRef.current = null
    },
    [
      collectionSlug,
      contextRef,
      dispatchFields,
      globalSlug,
      id,
      operation,
      getFormState,
      docPermissions,
      getDocPreferences,
      locale,
    ],
  )

  useEffect(() => {
    const abortOnChange = abortResetFormRef.current

    return () => {
      abortAndIgnore(abortOnChange)
    }
  }, [])

  return {
    dispatchFields,
    formState,
    isModified,
    isValid,
    prevFormStateRef,
    resetFormState,
    setIsValid,
    setModified,
    validateForm,
  }
}
