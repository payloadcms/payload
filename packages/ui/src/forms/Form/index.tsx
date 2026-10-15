'use client'
import type { FormState, PayloadRequest } from 'payload'

import { dequal } from 'dequal/lite' // lite: no need for Map and Set support
import { serialize } from 'object-to-formdata'
import {
  deepCopyObjectSimpleWithoutReactComponents,
  getDataByPath as getDataByPathFunc,
  getSiblingData as getSiblingDataFunc,
  hasDraftValidationEnabled,
  reduceFieldsToValues,
  uploadRequiresServerValidation,
  wait,
} from 'payload/shared'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import type {
  CreateFormData,
  FieldAction,
  Context as FormContextType,
  FormProps,
  GetDataByPath,
  Submit,
  SubmitOptions,
} from './types.js'

import { FieldErrorsToast } from '../../elements/Toasts/fieldErrors.js'
import { useDebouncedEffect } from '../../hooks/useDebouncedEffect.js'
import { useEffectEvent } from '../../hooks/useEffectEvent.js'
import { type QueueContext, useQueue } from '../../hooks/useQueue.js'
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
import { changesFormData } from './changesFormData.js'
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
  SuccessfulSubmitCountContext,
  useDocumentForm,
} from './context.js'
import { errorMessages } from './errorMessages.js'
import { fieldReducer } from './fieldReducer.js'
import { initContextState } from './initContextState.js'

const baseClass = 'form'
const requestPriority = {
  autosave: 1,
  formState: 0,
  submit: 2,
} as const

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

  const currentLocale = useLocale()
  const locale = currentLocale?.code
  const { i18n, t } = useTranslation()
  const { refreshCookie, user } = useAuth()
  const onNonFieldError = useFormErrorHandler()
  const operation = useOperation()

  const { getFormState } = useServerFunctions()
  const { startRouteTransition } = useRouteTransition()
  const { getUploadHandler } = useUploadHandlers()

  const { config } = useConfig()

  const [disabled, _setDisabled] = useState(disabledFromProps || false)
  const disabledRef = useRef(disabled)
  const setDisabled = useCallback((disabled: boolean) => {
    disabledRef.current = disabled
    _setDisabled(disabled)
  }, [])
  const disabledFromPropsRef = useRef(Boolean(disabledFromProps))
  disabledFromPropsRef.current = Boolean(disabledFromProps)
  const [isMounted, setIsMounted] = useState(false)
  const isMountedRef = useRef(false)

  const [submitted, setSubmitted] = useState(false)
  const [successfulSubmitCount, setSuccessfulSubmitCount] = useState(0)

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
  }, [setBackgroundProcessing, setDisabled])

  const [modified, _setModified] = useState(false)
  const formSequenceRef = useRef(0)
  const requestQueueOptions = useMemo(() => ({ getSequence: () => formSequenceRef.current }), [])
  const { reset: resetRequestQueue, schedule: scheduleRequest } = useQueue(requestQueueOptions)

  const setModified = useCallback((modified: boolean) => {
    if (modified) {
      formSequenceRef.current += 1
    }
    _setModified(modified)
  }, [])

  const formRef = useRef<HTMLFormElement>(null)
  const contextRef = useRef({} as FormContextType)
  const abortResetFormRef = useRef<AbortController>(null)
  const resetSequenceRef = useRef(0)
  const onChangeSequenceRef = useRef(0)
  const latestExplicitSubmitRef = useRef<Promise<boolean> | undefined>(undefined)
  const submissionErrorsRef = useRef<{ fields: FormState; isCurrent: () => boolean } | undefined>(
    undefined,
  )

  const [formState, setFormState] = useState<FormState>(() => initialState || {})
  const formStateRef = useRef(formState)

  const dispatchFieldsWithoutIncrementingFormSequence = useCallback<React.Dispatch<FieldAction>>(
    (action) => {
      const newState = fieldReducer(formStateRef.current, action)

      // Queued requests can start before React commits the preceding request's state update.
      formStateRef.current = newState
      contextRef.current.fields = newState
      setFormState(newState)
    },
    [],
  )

  const dispatchFields = useCallback<React.Dispatch<FieldAction>>(
    (action) => {
      if (changesFormData(action, contextRef.current.fields)) {
        formSequenceRef.current += 1
      }

      dispatchFieldsWithoutIncrementingFormSequence(action)
    },
    [dispatchFieldsWithoutIncrementingFormSequence],
  )

  contextRef.current.fields = formStateRef.current

  const prevFormState = useRef(formState)

  const validateForm = useCallback(
    async (isCurrentRequest?: () => boolean) => {
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

      if (isCurrentRequest?.() === false) {
        return false
      }

      if (!dequal(contextRef.current.fields, validatedFieldState)) {
        dispatchFieldsWithoutIncrementingFormSequence({
          type: 'REPLACE_STATE',
          state: validatedFieldState,
        })
      }

      setIsValid(isValid)

      return isValid
    },
    [
      collectionSlug,
      config,
      dispatchFieldsWithoutIncrementingFormSequence,
      id,
      operation,
      t,
      user,
      documentForm,
    ],
  )

  const executeSubmit = useCallback(
    async ({
      onResponse,
      options,
      requestContext,
    }: {
      onResponse: (args: { res: Response }) => void
      options: SubmitOptions | undefined
      requestContext: QueueContext
    }) => {
      const {
        acceptValues = true,
        action: actionArg = action,
        context,
        disableFormWhileProcessing = true,
        disableSuccessStatus: disableSuccessStatusFromArgs,
        method: methodToUse = method,
        onStaleRequest,
        overrides: overridesFromArgs = {},
        requestIntent,
        skipValidation,
      } = options || ({} as SubmitOptions)

      const disableToast = disableSuccessStatusFromArgs ?? disableSuccessStatus

      // create new toast promise which will resolve manually later
      let errorToast, successToast
      let promiseToastID: number | string | undefined
      let preservePromiseToast = false

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

          // Autocomplete updates happen before the data snapshot and belong to this submission.
          const dispatchedSequence = formSequenceRef.current
          const { isGenerationCurrent } = requestContext

          requestContext = {
            isCurrent: () =>
              isGenerationCurrent() && formSequenceRef.current === dispatchedSequence,
            isGenerationCurrent,
          }
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
            dispatchFieldsWithoutIncrementingFormSequence({
              type: 'REPLACE_STATE',
              state: revalidatedFormState,
            })
            submissionErrorsRef.current = {
              fields: revalidatedFormState,
              isCurrent: requestContext.isCurrent,
            }
            return
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
          submissionErrorsRef.current = {
            fields: contextRef.current.fields,
            isCurrent: requestContext.isCurrent,
          }
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

        onResponse({ res })

        if (typeof handleResponse === 'function') {
          if (requestContext.isCurrent()) {
            _setModified(false)
            preservePromiseToast = true
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
          if (!requestContext.isCurrent()) {
            return
          }

          let newFormState: FormState | void
          const successSequence = formSequenceRef.current
          const successResetSequence = resetSequenceRef.current

          setSuccessfulSubmitCount((count) => count + 1)

          if (typeof onSuccess === 'function') {
            newFormState = await onSuccess(json, {
              context,
              formState: serializableFormState,
              isCurrent: requestContext.isCurrent,
            })
          }

          if (!requestContext.isCurrent()) {
            // A successful drawer callback can unmount the form before its toast resolves.
            if (
              !isMountedRef.current &&
              formSequenceRef.current === successSequence &&
              resetSequenceRef.current === successResetSequence + 1 &&
              !redirect &&
              !disableToast
            ) {
              preservePromiseToast = true
              successToast(json.message || t('general:submissionSuccessful'))
            }
            return
          }

          preservePromiseToast = true
          submissionErrorsRef.current = undefined

          if (newFormState) {
            dispatchFieldsWithoutIncrementingFormSequence({
              type: 'MERGE_SERVER_STATE',
              acceptValues,
              prevStateRef: prevFormState,
              serverState: newFormState,
            })
          }

          _setModified(false)
          setSubmitted(false)

          if (redirect) {
            if (requestContext.isCurrent()) {
              startRouteTransition(() => router.push(redirect))
            }
          } else if (!disableToast) {
            successToast(json.message || t('general:submissionSuccessful'))
          }
        } else {
          if (!requestContext.isCurrent()) {
            return
          }

          preservePromiseToast = true
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

            dispatchFieldsWithoutIncrementingFormSequence({
              type: 'ADD_SERVER_ERRORS',
              errors: fieldErrors,
            })
            submissionErrorsRef.current = {
              fields: contextRef.current.fields,
              isCurrent: requestContext.isCurrent,
            }

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
        const isCurrentRequest = requestContext.isCurrent()

        if (preservePromiseToast || isCurrentRequest) {
          preservePromiseToast = true
          console.error('Error submitting form', err) // eslint-disable-line no-console

          if (isCurrentRequest) {
            setSubmitted(true)
          }

          errorToast(err.message)
        }
      } finally {
        if (!preservePromiseToast && !requestContext.isCurrent() && promiseToastID !== undefined) {
          toast.dismiss(promiseToastID)
        }

        if (requestContext.isGenerationCurrent()) {
          if (requestIntent === 'autosave') {
            setBackgroundProcessing(false)
          }

          setProcessing(false)
          setDisabled(disabledFromPropsRef.current)

          if (requestIntent === 'autosave' && !requestContext.isCurrent()) {
            onStaleRequest?.()
          }
        }
      }
    },
    [
      beforeSubmit,
      dispatchFieldsWithoutIncrementingFormSequence,
      startRouteTransition,
      action,
      disableSuccessStatus,
      disableValidationOnSubmit,
      handleResponse,
      method,
      onSubmit,
      onSuccess,
      redirect,
      router,
      setBackgroundProcessing,
      setDisabled,
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
      if (disabledRef.current) {
        return
      }

      const resetSequence = resetSequenceRef.current
      let didReceiveSuccessfulResponse = false
      const scheduledRequest = scheduleRequest({
        priority: requestPriority[options?.requestIntent ?? 'submit'],
        run: (requestContext) =>
          executeSubmit({
            onResponse: ({ res }) => {
              didReceiveSuccessfulResponse = Boolean(res?.ok)
            },
            options,
            requestContext,
          }),
      })

      if (options?.requestIntent !== 'autosave') {
        latestExplicitSubmitRef.current = scheduledRequest.then(
          () => didReceiveSuccessfulResponse,
          () => didReceiveSuccessfulResponse,
        )
      }

      const result = await scheduledRequest

      if (result.status === 'superseded' && options?.requestIntent === 'autosave') {
        let explicitSubmit = latestExplicitSubmitRef.current
        let didSubmitSucceed = true

        // A successful publish must finish before deciding whether to recover the draft.
        while (explicitSubmit !== undefined) {
          didSubmitSucceed = await explicitSubmit

          if (explicitSubmit === latestExplicitSubmitRef.current) {
            break
          }

          explicitSubmit = latestExplicitSubmitRef.current
        }

        if (
          !didSubmitSucceed &&
          isMountedRef.current &&
          resetSequence === resetSequenceRef.current
        ) {
          options.onStaleRequest?.()
        }
      }

      return result.status === 'completed' ? result.value : undefined
    },
    [executeSubmit, scheduleRequest],
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

        if (
          typeof handler === 'function' &&
          !uploadRequiresServerValidation({
            allowRestrictedFileTypes: docConfig.upload.allowRestrictedFileTypes,
            filename: file.name,
            mimeType: file.type,
          })
        ) {
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
      resetRequestQueue()
      formSequenceRef.current = 0
      onChangeSequenceRef.current = 0
      restoreRequestState()

      const dispatchedSequence = formSequenceRef.current
      const controller = handleAbortRef(abortResetFormRef)
      const isCurrentReset = () =>
        resetSequenceRef.current === resetSequence && formSequenceRef.current === dispatchedSequence
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

      resetRequestQueue()
      formSequenceRef.current = 0
      onChangeSequenceRef.current = 0
      restoreRequestState()
      contextRef.current = { ...initContextState } as FormContextType
      _setModified(false)
      dispatchFieldsWithoutIncrementingFormSequence({ type: 'REPLACE_STATE', state: newState })

      clearResetController()
    },
    [
      collectionSlug,
      globalSlug,
      id,
      operation,
      getFormState,
      docPermissions,
      getDocPreferences,
      locale,
      resetRequestQueue,
      restoreRequestState,
      dispatchFieldsWithoutIncrementingFormSequence,
    ],
  )

  const replaceState = useCallback(
    (state: FormState) => {
      resetSequenceRef.current += 1
      resetRequestQueue()
      formSequenceRef.current = 0
      onChangeSequenceRef.current = 0
      restoreRequestState()
      contextRef.current = { ...initContextState } as FormContextType
      _setModified(false)
      dispatchFieldsWithoutIncrementingFormSequence({ type: 'REPLACE_STATE', state })
    },
    [dispatchFieldsWithoutIncrementingFormSequence, resetRequestQueue, restoreRequestState],
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
  }, [disabledFromProps, setDisabled])

  useEffect(() => {
    if (typeof submittedFromProps === 'boolean') {
      setSubmitted(submittedFromProps)
    }
  }, [submittedFromProps])

  useEffect(() => {
    if (initialState) {
      resetSequenceRef.current += 1
      resetRequestQueue()
      formSequenceRef.current = 0
      onChangeSequenceRef.current = 0
      restoreRequestState()
      contextRef.current = { ...initContextState } as FormContextType
      _setModified(false)
      dispatchFieldsWithoutIncrementingFormSequence({
        type: 'REPLACE_STATE',
        optimize: false,
        state: initialState,
      })
    }
  }, [
    dispatchFieldsWithoutIncrementingFormSequence,
    initialState,
    resetRequestQueue,
    restoreRequestState,
  ])

  useEffect(() => {
    resetSequenceRef.current += 1
    resetRequestQueue()
    formSequenceRef.current = 0
    onChangeSequenceRef.current = 0
    restoreRequestState()
  }, [resetRequestQueue, restoreRequestState, uuid])

  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
      resetSequenceRef.current += 1
      resetRequestQueue()
    }
  }, [resetRequestQueue])

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
    void scheduleRequest({
      priority: requestPriority.formState,
      run: async (requestContext) => {
        if (onChangeSequenceRef.current === formSequenceRef.current) {
          return
        }

        onChangeSequenceRef.current = formSequenceRef.current

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
          dispatchFieldsWithoutIncrementingFormSequence({
            type: 'MERGE_SERVER_STATE',
            prevStateRef: prevFormState,
            serverState,
          })

          // Refreshes cannot reproduce every submit-time validation, including uniqueness checks.
          if (submissionErrorsRef.current?.isCurrent()) {
            dispatchFieldsWithoutIncrementingFormSequence({
              type: 'ADD_SERVER_ERRORS',
              errors: Object.entries(submissionErrorsRef.current.fields).flatMap(([path, field]) =>
                field.valid === false
                  ? [{ message: field.errorMessage || t('error:correctInvalidFields'), path }]
                  : [],
              ),
            })
          }
        }
      },
    }).catch((err) => {
      console.error('Error in queued function:', err) // eslint-disable-line no-console
    })
  })

  useDebouncedEffect(
    () => {
      if (onChangeSequenceRef.current !== formSequenceRef.current && modified) {
        executeOnChange(submitted)
      }

      prevFormState.current = formState
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
                      <FormFieldsContext.Provider value={[formState, dispatchFields]}>
                        <SuccessfulSubmitCountContext value={successfulSubmitCount}>
                          {children}
                        </SuccessfulSubmitCountContext>
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
