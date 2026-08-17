'use client'
import { dequal } from 'dequal/lite' // lite: no need for Map and Set support
import { serialize } from 'object-to-formdata'
import { type FormState, type PayloadRequest } from 'payload'
import {
  deepCopyObjectSimpleWithoutReactComponents,
  getDataByPath as getDataByPathFunc,
  getSiblingData as getSiblingDataFunc,
  hasDraftValidationEnabled,
  reduceFieldsToValues,
  wait,
} from 'payload/shared'
import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { toast } from 'sonner'

import type { FormRequestContext } from './requestScheduler.js'
import type {
  CreateFormData,
  Context as FormContextType,
  FormProps,
  GetDataByPath,
  Submit,
  SubmitOptions,
} from './types.js'

import { FieldErrorsToast } from '../../elements/Toasts/fieldErrors.js'
import { useDebouncedEffect } from '../../hooks/useDebouncedEffect.js'
import { useEffectEvent } from '../../hooks/useEffectEvent.js'
import { useThrottledEffect } from '../../hooks/useThrottledEffect.js'
import { useAuth } from '../../providers/Auth/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useFormErrorHandler } from '../../providers/FormErrorHandler/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useOperation } from '../../providers/Operation/index.js'
import { useRouter } from '../../providers/RouterAdapter/index.js'
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
import { createFormRequestScheduler } from './requestScheduler.js'

const baseClass = 'form'

export const Form: React.FC<FormProps> = (props) => {
  const { id, collectionSlug, docConfig, docPermissions, getDocPreferences, globalSlug } =
    useDocumentInfo()

  const validateDrafts = hasDraftValidationEnabled(docConfig)

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
  const onNonFieldError = useFormErrorHandler()
  const operation = useOperation()

  const { getFormState } = useServerFunctions()
  const { startRouteTransition } = useRouteTransition()
  const { getUploadHandler } = useUploadHandlers()

  const { config } = useConfig()

  const [disabled, setDisabled] = useState(disabledFromProps || false)
  const disabledFromPropsRef = useRef(Boolean(disabledFromProps))
  disabledFromPropsRef.current = Boolean(disabledFromProps)
  const [isMounted, setIsMounted] = useState(false)

  const [submitted, setSubmitted] = useState(false)

  /**
   * Tracks wether the form state passes validation.
   * For example the state could be submitted but invalid as field errors have been returned.
   */
  const [isValid, setIsValid] = useState(true)
  const [initializing, setInitializing] = useState(initializingFromProps)

  const [processing, setProcessing] = useState(false)

  /**
   * Determines whether the form is processing asynchronously in the background, e.g. autosave is running.
   * Useful to determine whether to disable the form or queue other processes while in flight, e.g. disable manual submits while an autosave is running.
   */
  const [backgroundProcessing, _setBackgroundProcessing] = useState(false)

  const setBackgroundProcessing = useCallback((backgroundProcessing: boolean) => {
    _setBackgroundProcessing(backgroundProcessing)
  }, [])

  const restoreRequestState = useCallback(() => {
    setBackgroundProcessing(false)
    setProcessing(false)
    setDisabled(disabledFromPropsRef.current)
  }, [setBackgroundProcessing])

  const [modified, _setModified] = useState(false)
  const formRevisionRef = useRef(0)
  const [requestScheduler] = useState(() =>
    createFormRequestScheduler({ getRevision: () => formRevisionRef.current }),
  )

  const setModified = useCallback((modified: boolean) => {
    if (modified) {
      formRevisionRef.current += 1
    }
    _setModified(modified)
  }, [])

  const formRef = useRef<HTMLFormElement>(null)
  const contextRef = useRef({} as FormContextType)
  const abortResetFormRef = useRef<AbortController>(null)
  const resetSequenceRef = useRef(0)
  const isFirstRenderRef = useRef(true)

  const fieldsReducer = useReducer(fieldReducer, {}, () => initialState)

  const [formState, dispatchFields] = fieldsReducer

  contextRef.current.fields = formState

  const prevFormState = useRef(formState)

  const validateForm = useCallback(
    async (isCurrent?: () => boolean) => {
      const validatedFieldState = {}
      let isValid = true

      const data = contextRef.current.getData()

      const validationPromises = Object.entries(contextRef.current.fields).map(
        async ([path, field]) => {
          const validatedField = { ...field }
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

      if (isCurrent && !isCurrent()) {
        return false
      }

      if (!dequal(contextRef.current.fields, validatedFieldState)) {
        dispatchFields({ type: 'REPLACE_STATE', state: validatedFieldState })
      }

      setIsValid(isValid)

      return isValid
    },
    [collectionSlug, config, dispatchFields, id, operation, t, user, documentForm],
  )

  const executeSubmit = useCallback(
    async (options: SubmitOptions | undefined, requestContext: FormRequestContext) => {
      const {
        acceptValues = true,
        action: actionArg = action,
        context,
        disableFormWhileProcessing = true,
        disableSuccessStatus: disableSuccessStatusFromArgs,
        method: methodToUse = method,
        overrides: overridesFromArgs = {},
        requestIntent,
        skipValidation,
      } = options || ({} as SubmitOptions)

      const disableToast = disableSuccessStatusFromArgs ?? disableSuccessStatus

      // create new toast promise which will resolve manually later
      let errorToast, successToast
      let promiseToastID: number | string | undefined

      const promise = new Promise((resolve, reject) => {
        successToast = resolve
        errorToast = reject
      })

      const hasFormSubmitAction =
        actionArg || typeof action === 'string' || typeof action === 'function'

      if (redirect || disableToast || !hasFormSubmitAction) {
        // Do not show submitting toast, as the promise toast may never disappear under these conditions.
        // Instead, make successToast() or errorToast() throw toast.success / toast.error
        successToast = (data) => toast.success(data)
        errorToast = (data) => toast.error(data)
      } else {
        const promiseToast = toast.promise(promise, {
          error: (data) => {
            return data as string
          },
          loading: t('general:submitting'),
          success: (data) => {
            return data as string
          },
        })
        const promiseToastValue = promiseToast.valueOf()

        if (typeof promiseToastValue === 'number' || typeof promiseToastValue === 'string') {
          promiseToastID = promiseToastValue
        }
      }

      if (disableFormWhileProcessing) {
        setProcessing(true)
        setDisabled(true)
      }

      if (requestIntent === 'autosave') {
        setBackgroundProcessing(true)
      }

      try {
        if (waitForAutocomplete) {
          await wait(100)
        }

        if (!requestContext.isCurrent()) {
          return
        }

        const data = reduceFieldsToValues(contextRef.current.fields, true)

        const serializableFormState = deepCopyObjectSimpleWithoutReactComponents(
          contextRef.current.fields,
          {
            excludeFiles: true,
          },
        )

        // Execute server side validations
        if (Array.isArray(beforeSubmit)) {
          let revalidatedFormState: FormState

          for (const beforeSubmitFn of beforeSubmit) {
            revalidatedFormState = await beforeSubmitFn({
              formState: serializableFormState,
            })

            if (!requestContext.isCurrent()) {
              return
            }
          }

          const isValid = Object.entries(revalidatedFormState).every(
            ([, field]) => field.valid !== false,
          )

          setIsValid(isValid)

          if (!isValid) {
            setSubmitted(true)
            return dispatchFields({ type: 'REPLACE_STATE', state: revalidatedFormState })
          }
        }

        const isValid =
          skipValidation || disableValidationOnSubmit
            ? true
            : await validateForm(requestContext.isCurrent)

        if (!requestContext.isCurrent()) {
          return
        }

        setIsValid(isValid)

        // If not valid, prevent submission
        if (!isValid) {
          errorToast(t('error:correctInvalidFields'))
          setSubmitted(true)
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
          for (const [key, value] of Object.entries(overrides)) {
            data[key] = value
          }

          onSubmit(contextRef.current.fields, data)
        }

        if (!hasFormSubmitAction) {
          // No action provided, so we should return. An example where this happens are lexical link drawers. Upon submitting the drawer, we
          // want to close it without submitting the form. Stuff like validation would be handled by lexical before this, through beforeSubmit
          setSubmitted(true)
          return
        }

        const formData = await contextRef.current.createFormData(overrides, {
          data,
          mergeOverrideData: Boolean(typeof overridesFromArgs !== 'function'),
        })

        if (!requestContext.isCurrent()) {
          return
        }

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

        if (requestContext.isCurrent()) {
          _setModified(false)
        }

        if (typeof handleResponse === 'function') {
          if (requestContext.isCurrent()) {
            handleResponse(res, successToast, errorToast)
          }

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
          let newFormState: FormState | void

          if (typeof onSuccess === 'function') {
            newFormState = await onSuccess(json, {
              context,
              formState: serializableFormState,
              isCurrent: requestContext.isCurrent,
            })
          }

          if (!requestContext.isCurrent()) {
            return { res }
          }

          if (newFormState) {
            dispatchFields({
              type: 'MERGE_SERVER_STATE',
              acceptValues,
              prevStateRef: prevFormState,
              serverState: newFormState,
            })
          }

          setSubmitted(false)

          if (redirect) {
            startRouteTransition(() => router.push(redirect))
          } else if (!disableToast) {
            successToast(json.message || t('general:submissionSuccessful'))
          }
        } else {
          if (!requestContext.isCurrent()) {
            return { res }
          }

          setSubmitted(true)

          // When there was an error submitting a draft,
          // set the form state to unsubmitted, to not trigger visible form validation on changes after the failed submit.
          // Also keep the form as modified so the save button remains enabled for retry.
          if (overridesFromArgs['_status'] === 'draft') {
            _setModified(true)

            if (!validateDrafts) {
              setSubmitted(false)
            }
          }

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
              // Pass overridesFromArgs (not the computed overrides) so a retry re-evaluates any function overrides against current fields.
              if (onNonFieldError?.(err, () => void submit({ overrides: overridesFromArgs }))) {
                return
              }
              errorToast(<FieldErrorsToast errorMessage={err.message || t('error:unknown')} />)
            })

            return
          }

          const message = errorMessages?.[res.status] || res?.statusText || t('error:unknown')

          errorToast(message)
        }

        return {
          ...(requestContext.isCurrent() ? { formState: contextRef.current.fields } : {}),
          res,
        }
      } catch (err) {
        if (requestContext.isCurrent()) {
          console.error('Error submitting form', err) // eslint-disable-line no-console
          setSubmitted(true)
          errorToast(err.message)
        }
      } finally {
        if (!requestContext.isCurrent() && promiseToastID !== undefined) {
          toast.dismiss(promiseToastID)
        }

        if (requestContext.isGenerationCurrent()) {
          if (requestIntent === 'autosave') {
            setBackgroundProcessing(false)
          }

          setProcessing(false)
          setDisabled(disabledFromPropsRef.current)
        }
      }
    },
    [
      beforeSubmit,
      startRouteTransition,
      action,
      disableSuccessStatus,
      disableValidationOnSubmit,
      dispatchFields,
      handleResponse,
      method,
      onSubmit,
      onSuccess,
      redirect,
      router,
      setBackgroundProcessing,
      t,
      i18n,
      validateDrafts,
      waitForAutocomplete,
      setSubmitted,
      validateForm,
      onNonFieldError,
    ],
  )

  const submit = useCallback<Submit>(
    async (options, event) => {
      event?.stopPropagation()
      event?.preventDefault()
      if (disabled) {
        return
      }

      const result = await requestScheduler.schedule({
        intent: options?.requestIntent ?? 'submit',
        run: (requestContext) => executeSubmit(options, requestContext),
      })

      return result.status === 'completed' ? result.value : undefined
    },
    [disabled, executeSubmit, requestScheduler],
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
    async (overrides, { data: dataFromArgs, mergeOverrideData = true }) => {
      let data = dataFromArgs || reduceFieldsToValues(contextRef.current.fields, true)

      let file = data?.file

      if (docConfig && 'upload' in docConfig && docConfig.upload && file) {
        delete data.file

        const handler = getUploadHandler({ collectionSlug })

        if (typeof handler === 'function') {
          file = JSON.stringify(
            await handler({
              docPrefix: typeof data?.prefix === 'string' ? data.prefix : undefined,
              file,
            }),
          )
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
      const resetSequence = ++resetSequenceRef.current
      requestScheduler.reset()
      formRevisionRef.current = 0
      restoreRequestState()

      const dispatchedRevision = formRevisionRef.current
      const controller = handleAbortRef(abortResetFormRef)
      const isCurrentReset = () =>
        resetSequenceRef.current === resetSequence && formRevisionRef.current === dispatchedRevision
      const clearResetController = () => {
        if (abortResetFormRef.current === controller) {
          abortResetFormRef.current = null
        }
      }

      const docPreferences = await getDocPreferences()

      if (!isCurrentReset()) {
        clearResetController()
        return
      }

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

      if (!isCurrentReset()) {
        clearResetController()
        return
      }

      requestScheduler.reset()
      formRevisionRef.current = 0
      restoreRequestState()
      contextRef.current = { ...initContextState } as FormContextType
      _setModified(false)
      dispatchFields({ type: 'REPLACE_STATE', state: newState })

      clearResetController()
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
      requestScheduler,
      restoreRequestState,
    ],
  )

  const replaceState = useCallback(
    (state: FormState) => {
      resetSequenceRef.current += 1
      requestScheduler.reset()
      formRevisionRef.current = 0
      restoreRequestState()
      contextRef.current = { ...initContextState } as FormContextType
      _setModified(false)
      dispatchFields({ type: 'REPLACE_STATE', state })
    },
    [dispatchFields, requestScheduler, restoreRequestState],
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
    [dispatchFields, getDataByPath, setModified],
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
    [dispatchFields, setModified],
  )

  const removeFieldRow: FormContextType['removeFieldRow'] = useCallback(
    ({ path, rowIndex }) => {
      dispatchFields({ type: 'REMOVE_ROW', path, rowIndex })

      setModified(true)
    },
    [dispatchFields, setModified],
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
    [dispatchFields, getDataByPath, setModified],
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
      resetSequenceRef.current += 1
      requestScheduler.reset()
      formRevisionRef.current = 0
      restoreRequestState()
      contextRef.current = { ...initContextState } as FormContextType
      _setModified(false)
      dispatchFields({
        type: 'REPLACE_STATE',
        optimize: false,
        sanitize: true,
        state: initialState,
      })
    }
  }, [initialState, dispatchFields, requestScheduler, restoreRequestState])

  useEffect(() => {
    resetSequenceRef.current += 1
    requestScheduler.reset()
    formRevisionRef.current = 0
    restoreRequestState()
  }, [requestScheduler, restoreRequestState, uuid])

  useEffect(() => {
    return () => {
      resetSequenceRef.current += 1
      requestScheduler.reset()
    }
  }, [requestScheduler])

  useThrottledEffect(
    () => {
      refreshCookie()
    },
    15000,
    [formState],
  )

  const handleLocaleChange = useEffectEvent(() => {
    contextRef.current = { ...contextRef.current } // triggers rerender of all components that subscribe to form
    setModified(false)
  })

  useEffect(() => {
    handleLocaleChange()
  }, [locale])

  const classes = [className, baseClass].filter(Boolean).join(' ')

  const executeOnChange = useEffectEvent((submitted: boolean) => {
    void requestScheduler
      .schedule({
        intent: 'formState',
        run: async (requestContext) => {
          const requestFormState = deepCopyObjectSimpleWithoutReactComponents(
            contextRef.current.fields,
            { excludeFiles: true },
          )
          let serverState: FormState | undefined

          for (const onChangeFn of onChange ?? []) {
            // Edit view default onChange is in packages/ui/src/views/Edit/index.tsx. This onChange usually sends a form state request
            serverState = await onChangeFn({ formState: requestFormState, submitted })
          }

          if (serverState && requestContext.isCurrent()) {
            dispatchFields({
              type: 'MERGE_SERVER_STATE',
              prevStateRef: prevFormState,
              serverState,
            })
          }
        },
      })
      .catch((err) => {
        console.error('Error in queued function:', err) // eslint-disable-line no-console
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
      /**
       * data-form-ready signals if the form is ready to be used. This is used by our e2e tests
       * to wait for the form to be ready before interacting with it, reducing flakiness if the test is run in
       * slow network conditions.
       */
      data-form-ready={!processing && isMounted && !initializing}
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
