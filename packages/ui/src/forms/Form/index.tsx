'use client'
import { dequal } from 'dequal/lite' // lite: no need for Map and Set support
import { useRouter } from 'next/navigation.js'
import { serialize } from 'object-to-formdata'
import { type FormState, type PayloadRequest } from 'payload'
import {
  deepCopyObjectSimpleWithoutReactComponents,
  getDataByPath as getDataByPathFunc,
  getSiblingData as getSiblingDataFunc,
  reduceFieldsToValues,
  wait,
} from 'payload/shared'
import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { toast } from 'sonner'

import type {
  CreateFormData,
  Context as FormContextType,
  FormProps,
  GetDataByPath,
  SubmitOptions,
} from './types.js'

import { FieldErrorsToast } from '../../elements/Toasts/fieldErrors.js'
import { useDebouncedEffect } from '../../hooks/useDebouncedEffect.js'
import { useEffectEvent } from '../../hooks/useEffectEvent.js'
import { useQueues } from '../../hooks/useQueues.js'
import { useThrottledEffect } from '../../hooks/useThrottledEffect.js'
import { useAuth } from '../../providers/Auth/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useOperation } from '../../providers/Operation/index.js'
import { useRouteTransition } from '../../providers/RouteTransition/index.js'
import { useServerFunctions } from '../../providers/ServerFunctions/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { useUploadHandlers } from '../../providers/UploadHandlers/index.js'
import { abortAndIgnore, handleAbortRef } from '../../utilities/abortAndIgnore.js'
import { requests } from '../../utilities/api.js'
import {
  BackgroundProcessingContext,
  DocumentFormContext,
  FormContext,
  FormFieldsContext,
  FormWatchContext,
  InitializingContext,
  ModifiedContext,
  ProcessingContext,
  SubmittedContext,
  useDocumentForm,
} from './context.js'
import { errorMessages } from './errorMessages.js'
import { fieldReducer } from './fieldReducer.js'
import { initContextState } from './initContextState.js'

const baseClass = 'form'

export const Form: React.FC<FormProps> = (props) => {
  const { id, collectionSlug, docConfig, docPermissions, getDocPreferences, globalSlug } =
    useDocumentInfo()

  const {
    action,
    beforeSubmit,
    children,
    className,
    disabled: disabledFromProps,
    disableSuccessStatus,
    disableValidationOnSubmit,
    // fields: fieldsFromProps = collection?.fields || global?.fields,
    el,
    handleResponse,
    initialState, // fully formed initial field state
    isDocumentForm,
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

  const documentForm = useDocumentForm()

  const { code: locale } = useLocale()
  const { i18n, t } = useTranslation()
  const { refreshCookie, user } = useAuth()
  const operation = useOperation()
  const { queueTask } = useQueues()

  const { getFormState } = useServerFunctions()
  const { startRouteTransition } = useRouteTransition()
  const { getUploadHandler } = useUploadHandlers()

  const { config } = useConfig()

  const [disabled, setDisabled] = useState(disabledFromProps || false)
  const [isMounted, setIsMounted] = useState(false)
  const [modified, setModified] = useState(false)

  /**
   * Tracks wether the form state passes validation.
   * For example the state could be submitted but invalid as field errors have been returned.
   */
  const [isValid, setIsValid] = useState(true)
  const [initializing, setInitializing] = useState(initializingFromProps)
  const [processing, setProcessing] = useState(false)
  const [backgroundProcessing, setBackgroundProcessing] = useState(false)

  const [submitted, setSubmitted] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const contextRef = useRef({} as FormContextType)
  const abortResetFormRef = useRef<AbortController>(null)
  const isFirstRenderRef = useRef(true)

  const fieldsReducer = useReducer(fieldReducer, {}, () => initialState)

  const [formState, dispatchFields] = fieldsReducer

  contextRef.current.fields = formState

  const prevFormState = useRef(formState)

  const validateForm = useCallback(async () => {
    const validatedFieldState = {}
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
              // If there is a parent document form, we can get the data from that form
              blockData: undefined, // Will be expensive to get - not worth to pass to client-side validation, as this can be obtained by the user using `useFormFields()`
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
  }, [collectionSlug, config, dispatchFields, id, operation, t, user, documentForm])

  const submit = useCallback(
    async (options: SubmitOptions = {}, e): Promise<void> => {
      const {
        action: actionArg = action,
        method: methodToUse = method,
        overrides: overridesFromArgs = {},
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

        const serializableFields = deepCopyObjectSimpleWithoutReactComponents(
          contextRef.current.fields,
        )

        await beforeSubmit.reduce(async (priorOnChange, beforeSubmitFn) => {
          await priorOnChange

          const result = await beforeSubmitFn({
            formState: serializableFields,
          })

          revalidatedFormState = result
        }, Promise.resolve())

        const isValid = Object.entries(revalidatedFormState).every(
          ([, field]) => field.valid !== false,
        )

        setIsValid(isValid)

        if (!isValid) {
          setProcessing(false)
          setSubmitted(true)
          setDisabled(false)
          return dispatchFields({ type: 'REPLACE_STATE', state: revalidatedFormState })
        }
      }

      const isValid =
        skipValidation || disableValidationOnSubmit ? true : await contextRef.current.validateForm()

      setIsValid(isValid)
      // If not valid, prevent submission
      if (!isValid) {
        errorToast(t('error:correctInvalidFields'))
        setProcessing(false)
        setSubmitted(true)
        setDisabled(false)
        return
      }

      let overrides = {}

      if (typeof overridesFromArgs === 'function') {
        overrides = overridesFromArgs(contextRef.current.fields)
      } else if (typeof overridesFromArgs === 'object') {
        overrides = overridesFromArgs
      }

      // If submit handler comes through via props, run that
      if (onSubmit) {
        const serializableFields = deepCopyObjectSimpleWithoutReactComponents(
          contextRef.current.fields,
        )

        const data = reduceFieldsToValues(serializableFields, true)

        for (const [key, value] of Object.entries(overrides)) {
          data[key] = value
        }

        onSubmit(serializableFields, data)
      }

      if (!hasFormSubmitAction) {
        // No action provided, so we should return. An example where this happens are lexical link drawers. Upon submitting the drawer, we
        // want to close it without submitting the form. Stuff like validation would be handled by lexical before this, through beforeSubmit
        setProcessing(false)
        setSubmitted(true)
        setDisabled(false)
        return
      }

      const formData = await contextRef.current.createFormData(overrides, {
        mergeOverrideData: Boolean(typeof overridesFromArgs !== 'function'),
      })

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
            const newFormState = await onSuccess(json)

            if (newFormState) {
              dispatchFields({
                type: 'MERGE_SERVER_STATE',
                acceptValues: true,
                prevStateRef: prevFormState,
                serverState: newFormState,
              })
            }
          }
          setSubmitted(false)
          setProcessing(false)

          if (redirect) {
            startRouteTransition(() => router.push(redirect))
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
                    if (dataError?.path) {
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

            setIsValid(false)

            dispatchFields({
              type: 'ADD_SERVER_ERRORS',
              errors: fieldErrors,
            })

            nonFieldErrors.forEach((err) => {
              errorToast(<FieldErrorsToast errorMessage={err.message || t('error:unknown')} />)
            })

            return
          }

          const message = errorMessages?.[res.status] || res?.statusText || t('error:unknown')

          errorToast(message)
        }
      } catch (err) {
        console.error('Error submitting form', err) // eslint-disable-line no-console
        setProcessing(false)
        setSubmitted(true)
        setDisabled(false)
        errorToast(err.message)
      }
    },
    [
      beforeSubmit,
      startRouteTransition,
      action,
      disableSuccessStatus,
      disableValidationOnSubmit,
      disabled,
      dispatchFields,
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

  const createFormData = useCallback<CreateFormData>(
    async (overrides, { mergeOverrideData = true }) => {
      let data = reduceFieldsToValues(contextRef.current.fields, true)

      let file = data?.file

      if (docConfig && 'upload' in docConfig && docConfig.upload && file) {
        delete data.file

        const handler = getUploadHandler({ collectionSlug })

        if (typeof handler === 'function') {
          let filename = file.name
          const clientUploadContext = await handler({
            file,
            updateFilename: (value) => {
              filename = value
            },
          })

          file = JSON.stringify({
            clientUploadContext,
            collectionSlug,
            filename,
            mimeType: file.type,
            size: file.size,
          })
        }
      }

      if (mergeOverrideData) {
        data = {
          ...data,
          ...overrides,
        }
      } else {
        data = overrides
      }

      const dataToSerialize: Record<string, unknown> = {
        _payload: JSON.stringify(data),
      }

      if (docConfig && 'upload' in docConfig && docConfig.upload && file) {
        dataToSerialize.file = file
      }

      // nullAsUndefineds is important to allow uploads and relationship fields to clear themselves
      const formData = serialize(dataToSerialize, {
        indices: true,
        nullsAsUndefineds: false,
      })

      return formData
    },
    [collectionSlug, docConfig, getUploadHandler],
  )

  const reset = useCallback(
    async (data: unknown) => {
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

      contextRef.current = { ...initContextState } as FormContextType
      setModified(false)
      dispatchFields({ type: 'REPLACE_STATE', state: newState })

      abortResetFormRef.current = null
    },
    [
      collectionSlug,
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

  const replaceState = useCallback(
    (state: FormState) => {
      contextRef.current = { ...initContextState } as FormContextType
      setModified(false)
      dispatchFields({ type: 'REPLACE_STATE', state })
    },
    [dispatchFields],
  )

  const addFieldRow: FormContextType['addFieldRow'] = useCallback(
    ({ blockType, path, rowIndex: rowIndexArg, subFieldState }) => {
      const newRows: unknown[] = getDataByPath(path) || []
      const rowIndex = rowIndexArg === undefined ? newRows.length : rowIndexArg

      // dispatch ADD_ROW adds a blank row to local form state.
      // This performs no form state request, as the debounced onChange effect will do that for us.
      dispatchFields({
        type: 'ADD_ROW',
        blockType,
        path,
        rowIndex,
        subFieldState,
      })

      setModified(true)
    },
    [dispatchFields, getDataByPath],
  )

  const moveFieldRow: FormContextType['moveFieldRow'] = useCallback(
    ({ moveFromIndex, moveToIndex, path }) => {
      dispatchFields({
        type: 'MOVE_ROW',
        moveFromIndex,
        moveToIndex,
        path,
      })

      setModified(true)
    },
    [dispatchFields],
  )

  const removeFieldRow: FormContextType['removeFieldRow'] = useCallback(
    ({ path, rowIndex }) => {
      dispatchFields({ type: 'REMOVE_ROW', path, rowIndex })

      setModified(true)
    },
    [dispatchFields],
  )

  const replaceFieldRow: FormContextType['replaceFieldRow'] = useCallback(
    ({ blockType, path, rowIndex: rowIndexArg, subFieldState }) => {
      const currentRows: unknown[] = getDataByPath(path)
      const rowIndex = rowIndexArg === undefined ? currentRows.length : rowIndexArg

      dispatchFields({
        type: 'REPLACE_ROW',
        blockType,
        path,
        rowIndex,
        subFieldState,
      })

      setModified(true)
    },
    [dispatchFields, getDataByPath],
  )

  useEffect(() => {
    const abortOnChange = abortResetFormRef.current

    return () => {
      abortAndIgnore(abortOnChange)
    }
  }, [])

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
  contextRef.current.setBackgroundProcessing = setBackgroundProcessing

  contextRef.current.setSubmitted = setSubmitted
  contextRef.current.setIsValid = setIsValid
  contextRef.current.disabled = disabled
  contextRef.current.setDisabled = setDisabled
  contextRef.current.formRef = formRef
  contextRef.current.reset = reset
  contextRef.current.replaceState = replaceState
  contextRef.current.dispatchFields = dispatchFields
  contextRef.current.addFieldRow = addFieldRow
  contextRef.current.removeFieldRow = removeFieldRow
  contextRef.current.moveFieldRow = moveFieldRow
  contextRef.current.replaceFieldRow = replaceFieldRow
  contextRef.current.uuid = uuid
  contextRef.current.initializing = initializing
  contextRef.current.isValid = isValid

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
      dispatchFields({
        type: 'REPLACE_STATE',
        optimize: false,
        sanitize: true,
        state: initialState,
      })
    }
  }, [initialState, dispatchFields])

  useThrottledEffect(
    () => {
      refreshCookie()
    },
    15000,
    [formState],
  )

  useEffect(() => {
    contextRef.current = { ...contextRef.current } // triggers rerender of all components that subscribe to form
    setModified(false)
  }, [locale])

  const classes = [className, baseClass].filter(Boolean).join(' ')

  const executeOnChange = useEffectEvent((submitted: boolean) => {
    queueTask(async () => {
      if (Array.isArray(onChange)) {
        let serverState: FormState

        for (const onChangeFn of onChange) {
          // Edit view default onChange is in packages/ui/src/views/Edit/index.tsx. This onChange usually sends a form state request
          serverState = await onChangeFn({
            formState: deepCopyObjectSimpleWithoutReactComponents(formState),
            submitted,
          })
        }

        dispatchFields({
          type: 'MERGE_SERVER_STATE',
          prevStateRef: prevFormState,
          serverState,
        })
      }
    })
  })

  useDebouncedEffect(
    () => {
      if ((isFirstRenderRef.current || !dequal(formState, prevFormState.current)) && modified) {
        executeOnChange(submitted)
      }

      prevFormState.current = formState
      isFirstRenderRef.current = false
    },
    [modified, submitted, formState],
    250,
  )

  const DocumentFormContextComponent: React.FC<any> = isDocumentForm
    ? DocumentFormContext
    : React.Fragment

  const documentFormContextProps = isDocumentForm
    ? {
        value: contextRef.current,
      }
    : {}

  const El: 'form' = (el as unknown as 'form') || 'form'

  return (
    <El
      action={typeof action === 'function' ? void action : action}
      className={classes}
      method={method}
      noValidate
      onSubmit={(e) => void contextRef.current.submit({}, e)}
      ref={formRef}
    >
      <DocumentFormContextComponent {...documentFormContextProps}>
        <FormContext value={contextRef.current}>
          <FormWatchContext
            value={{
              fields: formState,
              ...contextRef.current,
            }}
          >
            <SubmittedContext value={submitted}>
              <InitializingContext value={!isMounted || (isMounted && initializing)}>
                <ProcessingContext value={processing}>
                  <BackgroundProcessingContext value={backgroundProcessing}>
                    <ModifiedContext value={modified}>
                      {/* eslint-disable-next-line @eslint-react/no-context-provider */}
                      <FormFieldsContext.Provider value={fieldsReducer}>
                        {children}
                      </FormFieldsContext.Provider>
                    </ModifiedContext>
                  </BackgroundProcessingContext>
                </ProcessingContext>
              </InitializingContext>
            </SubmittedContext>
          </FormWatchContext>
        </FormContext>
      </DocumentFormContextComponent>
    </El>
  )
}

export {
  DocumentFormContext,
  FormContext,
  FormFieldsContext,
  FormWatchContext,
  ModifiedContext,
  ProcessingContext,
  SubmittedContext,
  useAllFormFields,
  useDocumentForm,
  useForm,
  useFormFields,
  useFormModified,
  useFormProcessing,
  useFormSubmitted,
  useWatchForm,
} from './context.js'

export { FormProps }
