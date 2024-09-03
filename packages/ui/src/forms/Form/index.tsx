'use client'
import type { FormState, PayloadRequest } from 'payload'

import { dequal } from 'dequal/lite' // lite: no need for Map and Set support
import { useRouter } from 'next/navigation.js'
import { serialize } from 'object-to-formdata'
import {
  getDataByPath as getDataByPathFunc,
  getSiblingData as getSiblingDataFunc,
  reduceFieldsToValues,
  wait,
} from 'payload/shared'
import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { toast } from 'sonner'

import type {
  Context as FormContextType,
  FormProps,
  GetDataByPath,
  SubmitOptions,
} from './types.js'

import { useDebouncedEffect } from '../../hooks/useDebouncedEffect.js'
import { useThrottledEffect } from '../../hooks/useThrottledEffect.js'
import { useAuth } from '../../providers/Auth/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { EditDepthProvider } from '../../providers/EditDepth/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useOperation } from '../../providers/Operation/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { requests } from '../../utilities/api.js'
import { getFormState } from '../../utilities/getFormState.js'
import {
  FormContext,
  FormFieldsContext,
  FormWatchContext,
  InitializingContext,
  ModifiedContext,
  ProcessingContext,
  SubmittedContext,
} from './context.js'
import { errorMessages } from './errorMessages.js'
import { fieldReducer } from './fieldReducer.js'
import { initContextState } from './initContextState.js'
import { mergeServerFormState } from './mergeServerFormState.js'

const baseClass = 'form'

export const Form: React.FC<FormProps> = (props) => {
  const { id, collectionSlug, globalSlug } = useDocumentInfo()

  const {
    action,
    beforeSubmit,
    children,
    className,
    disabled: disabledFromProps,
    disableSuccessStatus,
    disableValidationOnSubmit,
    // fields: fieldsFromProps = collection?.fields || global?.fields,
    handleResponse,
    initialState, // fully formed initial field state
    isInitializing: initializingFromProps,
    onChange,
    onSubmit,
    onSuccess,
    redirect,
    submitted: submittedFromProps,
    uuid,
    waitForAutocomplete,
  } = props

  const method = 'method' in props ? props?.method : undefined

  const router = useRouter()

  const { code: locale } = useLocale()
  const { i18n, t } = useTranslation()
  const { refreshCookie, user } = useAuth()
  const operation = useOperation()

  const { config } = useConfig()
  const {
    routes: { api: apiRoute },
    serverURL,
  } = config

  const [disabled, setDisabled] = useState(disabledFromProps || false)
  const [isMounted, setIsMounted] = useState(false)
  const [modified, setModified] = useState(false)
  const [initializing, setInitializing] = useState(initializingFromProps)
  const [processing, setProcessing] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const contextRef = useRef({} as FormContextType)

  const fieldsReducer = useReducer(fieldReducer, {}, () => initialState)

  /**
   * `fields` is the current, up-to-date state/data of all fields in the form. It can be modified by using dispatchFields,
   * which calls the fieldReducer, which then updates the state.
   */
  const [fields, dispatchFields] = fieldsReducer

  contextRef.current.fields = fields

  const validateForm = useCallback(async () => {
    const validatedFieldState = {}
    let isValid = true

    const dataFromContext = contextRef.current.getData()
    const data = dataFromContext

    const validationPromises = Object.entries(contextRef.current.fields).map(
      async ([path, field]) => {
        const validatedField = field

        if (field.passesCondition !== false) {
          let validationResult: boolean | string = validatedField.valid

          if (typeof field.validate === 'function') {
            let valueToValidate = field.value

            if (field?.rows && Array.isArray(field.rows)) {
              valueToValidate = contextRef.current.getDataByPath(path)
            }

            validationResult = await field.validate(valueToValidate, {
              ...field,
              id,
              collectionSlug,
              data,
              operation,
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

    return isValid
  }, [collectionSlug, config, dispatchFields, id, operation, t, user])

  const submit = useCallback(
    async (options: SubmitOptions = {}, e): Promise<void> => {
      const {
        action: actionArg = action,
        method: methodToUse = method,
        overrides = {},
        skipValidation,
      } = options

      if (disabled) {
        if (e) {
          e.preventDefault()
        }
        return
      }

      // create new toast promise which will resolve manually later
      let errorToast, successToast
      const promise = new Promise((resolve, reject) => {
        successToast = resolve
        errorToast = reject
      })

      const hasFormSubmitAction =
        actionArg || typeof action === 'string' || typeof action === 'function'

      if (redirect || disableSuccessStatus || !hasFormSubmitAction) {
        // Do not show submitting toast, as the promise toast may never disappear under these conditions.
        // Instead, make successToast() or errorToast() throw toast.success / toast.error
        successToast = (data) => toast.success(data)
        errorToast = (data) => toast.error(data)
      } else {
        toast.promise(promise, {
          error: (data) => {
            return data as string
          },
          loading: t('general:submitting'),
          success: (data) => {
            return data as string
          },
        })
      }

      if (e) {
        e.stopPropagation()
        e.preventDefault()
      }

      setProcessing(true)
      setDisabled(true)

      if (waitForAutocomplete) {
        await wait(100)
      }

      // Execute server side validations
      if (Array.isArray(beforeSubmit)) {
        let revalidatedFormState: FormState

        await beforeSubmit.reduce(async (priorOnChange, beforeSubmitFn) => {
          await priorOnChange

          const result = await beforeSubmitFn({
            formState: fields,
          })

          revalidatedFormState = result
        }, Promise.resolve())

        const isValid = Object.entries(revalidatedFormState).every(([, field]) => field.valid)

        if (!isValid) {
          setProcessing(false)
          setSubmitted(true)
          setDisabled(false)
          return dispatchFields({ type: 'REPLACE_STATE', state: revalidatedFormState })
        }
      }

      const isValid =
        skipValidation || disableValidationOnSubmit ? true : await contextRef.current.validateForm()

      // If not valid, prevent submission
      if (!isValid) {
        errorToast(t('error:correctInvalidFields'))
        setProcessing(false)
        setSubmitted(true)
        setDisabled(false)
        return
      }

      // If submit handler comes through via props, run that
      if (onSubmit) {
        const data = {
          ...reduceFieldsToValues(fields, true),
          ...overrides,
        }

        onSubmit(fields, data)
      }

      if (!hasFormSubmitAction) {
        // No action provided, so we should return. An example where this happens are lexical link drawers. Upon submitting the drawer, we
        // want to close it without submitting the form. Stuff like validation would be handled by lexical before this, through beforeSubmit
        setProcessing(false)
        setSubmitted(true)
        setDisabled(false)
        return
      }

      const formData = contextRef.current.createFormData(overrides)

      try {
        let res

        if (typeof actionArg === 'string') {
          res = await requests[methodToUse.toLowerCase()](actionArg, {
            body: formData,
            headers: {
              'Accept-Language': i18n.language,
            },
          })
        } else if (typeof action === 'function') {
          res = await action(formData)
        }

        setModified(false)
        setDisabled(false)

        if (typeof handleResponse === 'function') {
          handleResponse(res, successToast, errorToast)
          return
        }

        const contentType = res.headers.get('content-type')
        const isJSON = contentType && contentType.indexOf('application/json') !== -1

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let json: Record<string, any> = {}

        if (isJSON) {
          json = await res.json()
        }
        if (res.status < 400) {
          if (typeof onSuccess === 'function') {
            await onSuccess(json)
          }
          setSubmitted(false)
          setProcessing(false)

          if (redirect) {
            router.push(redirect)
          } else if (!disableSuccessStatus) {
            successToast(json.message || t('general:submissionSuccessful'))
          }
        } else {
          setProcessing(false)
          setSubmitted(true)

          contextRef.current = { ...contextRef.current } // triggers rerender of all components that subscribe to form
          if (json.message) {
            errorToast(json.message)

            return
          }

          if (Array.isArray(json.errors)) {
            const [fieldErrors, nonFieldErrors] = json.errors.reduce(
              ([fieldErrs, nonFieldErrs], err) => {
                const newFieldErrs = []
                const newNonFieldErrs = []

                if (err?.message) {
                  newNonFieldErrs.push(err)
                }

                if (Array.isArray(err?.data?.errors)) {
                  err.data?.errors.forEach((dataError) => {
                    if (dataError?.field) {
                      newFieldErrs.push(dataError)
                    } else {
                      newNonFieldErrs.push(dataError)
                    }
                  })
                }

                return [
                  [...fieldErrs, ...newFieldErrs],
                  [...nonFieldErrs, ...newNonFieldErrs],
                ]
              },
              [[], []],
            )

            dispatchFields({
              type: 'ADD_SERVER_ERRORS',
              errors: fieldErrors,
            })

            nonFieldErrors.forEach((err) => {
              errorToast(err.message || t('error:unknown'))
            })

            return
          }

          const message = errorMessages?.[res.status] || res?.statusText || t('error:unknown')

          errorToast(message)
        }
      } catch (err) {
        console.error('Error submitting form', err)
        setProcessing(false)
        setSubmitted(true)
        setDisabled(false)

        errorToast(err.message)
      }
    },
    [
      beforeSubmit,
      action,
      disableSuccessStatus,
      disableValidationOnSubmit,
      disabled,
      dispatchFields,
      fields,
      handleResponse,
      method,
      onSubmit,
      onSuccess,
      redirect,
      router,
      t,
      i18n,
      waitForAutocomplete,
    ],
  )

  const getFields = useCallback(() => contextRef.current.fields, [])

  const getField = useCallback((path: string) => contextRef.current.fields[path], [])

  const getData = useCallback(() => reduceFieldsToValues(contextRef.current.fields, true), [])

  const getSiblingData = useCallback(
    (path: string) => getSiblingDataFunc(contextRef.current.fields, path),
    [],
  )
  const getDataByPath = useCallback<GetDataByPath>(
    (path: string) => getDataByPathFunc(contextRef.current.fields, path),
    [],
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createFormData = useCallback((overrides: any = {}) => {
    const data = reduceFieldsToValues(contextRef.current.fields, true)

    const file = data?.file

    if (file) {
      delete data.file
    }

    const dataWithOverrides = {
      ...data,
      ...overrides,
    }

    const dataToSerialize = {
      _payload: JSON.stringify(dataWithOverrides),
      file,
    }

    // nullAsUndefineds is important to allow uploads and relationship fields to clear themselves
    const formData = serialize(dataToSerialize, { indices: true, nullsAsUndefineds: false })

    return formData
  }, [])

  const reset = useCallback(
    async (data: unknown) => {
      const newState = await getFormState({
        apiRoute,
        body: {
          id,
          collectionSlug,
          data,
          globalSlug,
          operation,
          schemaPath: collectionSlug || globalSlug,
        },
        serverURL,
      })

      contextRef.current = { ...initContextState } as FormContextType
      setModified(false)
      dispatchFields({ type: 'REPLACE_STATE', state: newState })
    },
    [apiRoute, collectionSlug, dispatchFields, globalSlug, id, operation, serverURL],
  )

  const replaceState = useCallback(
    (state: FormState) => {
      contextRef.current = { ...initContextState } as FormContextType
      setModified(false)
      dispatchFields({ type: 'REPLACE_STATE', state })
    },
    [dispatchFields],
  )

  const getFieldStateBySchemaPath = useCallback(
    async ({ data, schemaPath }) => {
      const fieldSchema = await getFormState({
        apiRoute,
        body: {
          collectionSlug,
          data,
          globalSlug,
          schemaPath,
        },
        serverURL,
      })
      return fieldSchema
    },
    [apiRoute, collectionSlug, globalSlug, serverURL],
  )

  const addFieldRow: FormContextType['addFieldRow'] = useCallback(
    async ({ data, path, rowIndex, schemaPath }) => {
      const subFieldState = await getFieldStateBySchemaPath({ data, schemaPath })

      dispatchFields({
        type: 'ADD_ROW',
        blockType: data?.blockType,
        path,
        rowIndex,
        subFieldState,
      })
    },
    [getFieldStateBySchemaPath, dispatchFields],
  )

  const removeFieldRow: FormContextType['removeFieldRow'] = useCallback(
    ({ path, rowIndex }) => {
      dispatchFields({ type: 'REMOVE_ROW', path, rowIndex })
    },
    [dispatchFields],
  )

  const replaceFieldRow: FormContextType['replaceFieldRow'] = useCallback(
    async ({ data, path, rowIndex, schemaPath }) => {
      const subFieldState = await getFieldStateBySchemaPath({ data, schemaPath })

      dispatchFields({
        type: 'REPLACE_ROW',
        blockType: data?.blockType,
        path,
        rowIndex,
        subFieldState,
      })
    },
    [getFieldStateBySchemaPath, dispatchFields],
  )

  useEffect(() => {
    if (initializingFromProps !== undefined) {
      setInitializing(initializingFromProps)
    }
  }, [initializingFromProps])

  contextRef.current.submit = submit
  contextRef.current.getFields = getFields
  contextRef.current.getField = getField
  contextRef.current.getData = getData
  contextRef.current.getSiblingData = getSiblingData
  contextRef.current.getDataByPath = getDataByPath
  contextRef.current.validateForm = validateForm
  contextRef.current.createFormData = createFormData
  contextRef.current.setModified = setModified
  contextRef.current.setProcessing = setProcessing
  contextRef.current.setSubmitted = setSubmitted
  contextRef.current.disabled = disabled
  contextRef.current.setDisabled = setDisabled
  contextRef.current.formRef = formRef
  contextRef.current.reset = reset
  contextRef.current.replaceState = replaceState
  contextRef.current.dispatchFields = dispatchFields
  contextRef.current.addFieldRow = addFieldRow
  contextRef.current.removeFieldRow = removeFieldRow
  contextRef.current.replaceFieldRow = replaceFieldRow
  contextRef.current.uuid = uuid
  contextRef.current.initializing = initializing

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (typeof disabledFromProps === 'boolean') {
      setDisabled(disabledFromProps)
    }
  }, [disabledFromProps])

  useEffect(() => {
    if (typeof submittedFromProps === 'boolean') {
      setSubmitted(submittedFromProps)
    }
  }, [submittedFromProps])

  useEffect(() => {
    if (initialState) {
      contextRef.current = { ...initContextState } as FormContextType
      dispatchFields({ type: 'REPLACE_STATE', optimize: false, state: initialState })
    }
  }, [initialState, dispatchFields])

  useThrottledEffect(
    () => {
      refreshCookie()
    },
    15000,
    [fields],
  )

  useEffect(() => {
    contextRef.current = { ...contextRef.current } // triggers rerender of all components that subscribe to form
    setModified(false)
  }, [locale])

  const classes = [className, baseClass].filter(Boolean).join(' ')

  useDebouncedEffect(
    () => {
      const executeOnChange = async () => {
        if (Array.isArray(onChange)) {
          let revalidatedFormState: FormState = contextRef.current.fields

          for (const onChangeFn of onChange) {
            revalidatedFormState = await onChangeFn({
              formState: revalidatedFormState,
            })
          }

          const { changed, newState } = mergeServerFormState(
            contextRef.current.fields || {},
            revalidatedFormState,
          )

          if (changed) {
            dispatchFields({
              type: 'REPLACE_STATE',
              optimize: false,
              state: newState,
            })
          }
        }
      }

      if (modified) {
        void executeOnChange()
      }
    },
    150,
    // Make sure we trigger this whenever modified changes (not just when `fields` changes), otherwise we will miss merging server form state for the first form update/onChange. Here's why:
    // `fields` updates before `modified`, because setModified is in a setTimeout. So on the first change, modified is false, so we don't trigger the effect even though we should.
    [contextRef.current.fields, dispatchFields, onChange, modified],
  )

  return (
    <form
      action={typeof action === 'function' ? void action : action}
      className={classes}
      method={method}
      noValidate
      onSubmit={(e) => void contextRef.current.submit({}, e)}
      ref={formRef}
    >
      <EditDepthProvider>
        <FormContext.Provider value={contextRef.current}>
          <FormWatchContext.Provider
            value={{
              fields,
              ...contextRef.current,
            }}
          >
            <SubmittedContext.Provider value={submitted}>
              <InitializingContext.Provider value={!isMounted || (isMounted && initializing)}>
                <ProcessingContext.Provider value={processing}>
                  <ModifiedContext.Provider value={modified}>
                    <FormFieldsContext.Provider value={fieldsReducer}>
                      {children}
                    </FormFieldsContext.Provider>
                  </ModifiedContext.Provider>
                </ProcessingContext.Provider>
              </InitializingContext.Provider>
            </SubmittedContext.Provider>
          </FormWatchContext.Provider>
        </FormContext.Provider>
      </EditDepthProvider>
    </form>
  )
}

export {
  FormContext,
  FormFieldsContext,
  FormWatchContext,
  ModifiedContext,
  ProcessingContext,
  SubmittedContext,
  useAllFormFields,
  useForm,
  useFormFields,
  useFormModified,
  useFormProcessing,
  useFormSubmitted,
  useWatchForm,
} from './context.js'

export { FormProps }
