'use client'

import type { FormState } from 'payload'
import type { Dispatch, RefObject } from 'react'

import {
  deepCopyObjectSimpleWithoutReactComponents,
  hasDraftValidationEnabled,
  reduceFieldsToValues,
  wait,
} from 'payload/shared'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import type { QueueContext, UseQueueResult } from '../../hooks/useQueue.js'
import type {
  FieldAction,
  Context as FormContextType,
  FormProps,
  Submit,
  SubmitOptions,
} from './types.js'

import { FieldErrorsToast } from '../../elements/Toasts/fieldErrors.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useFormErrorHandler } from '../../providers/FormErrorHandler/index.js'
import { useRouter } from '../../providers/RouterAdapter/index.js'
import { useRouteTransition } from '../../providers/RouteTransition/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { requests } from '../../utilities/api.js'
import { errorMessages } from './errorMessages.js'
import { fieldReducer } from './fieldReducer.js'
import { requestPriority } from './requestPriority.js'

type Args = {
  contextRef: RefObject<FormContextType>
  dispatchFields: Dispatch<FieldAction>
  formRef: RefObject<HTMLFormElement | null>
  prevFormState: RefObject<FormState>
  props: FormProps
  requestScopeRef: RefObject<unknown>
  scheduleRequest: UseQueueResult['schedule']
  setIsValid: FormContextType['setIsValid']
}

export const useFormSubmission = ({
  contextRef,
  dispatchFields,
  formRef,
  prevFormState,
  props,
  requestScopeRef,
  scheduleRequest,
  setIsValid,
}: Args) => {
  const {
    action,
    beforeSubmit,
    disabled: disabledFromProps,
    disableSuccessStatus,
    disableValidationOnSubmit,
    handleResponse,
    onSubmit,
    onSuccess,
    redirect,
    submitted: submittedFromProps,
    waitForAutocomplete,
  } = props
  const method = 'method' in props ? props?.method : undefined
  const { docConfig } = useDocumentInfo()
  const validateDrafts = hasDraftValidationEnabled(docConfig)
  const router = useRouter()
  const { startRouteTransition } = useRouteTransition()
  const { i18n, t } = useTranslation()
  const onNonFieldError = useFormErrorHandler()

  /**
   * A ref that can be read within the `setModified` interceptor.
   * Dependents of this state can read it immediately without needing to wait for a render cycle.
   */
  const backgroundProcessingRef = useRef(false)

  /**
   * Flag to track if the form was modified _during a submission_, e.g. while autosave is running.
   * Useful in order to avoid resetting `modified` to false wrongfully after a submit.
   * For example, if the user modifies a field while the a background process (autosave) is running,
   * we need to ensure that after the submit completes, the `modified` state remains true.
   */
  const modifiedWhileProcessingRef = useRef(false)

  const [modified, _setModified] = useState(false)

  /**
   * Intercept the `setModified` method to track whether the event happened during background processing.
   * See the `modifiedWhileProcessingRef` ref for more details.
   */
  const setModified = useCallback((modified: boolean) => {
    if (backgroundProcessingRef.current) {
      modifiedWhileProcessingRef.current = true
    }

    _setModified(modified)
  }, [])

  const latestExplicitSubmitRef = useRef<Promise<boolean> | undefined>(undefined)

  const [disabled, setDisabled] = useState(disabledFromProps || false)

  const [submitted, setSubmitted] = useState(false)

  const [successfulSubmitCount, setSuccessfulSubmitCount] = useState(0)

  const [processing, setProcessing] = useState(false)

  /**
   * Determines whether the form is processing asynchronously in the background, e.g. autosave is running.
   * Useful to determine whether to disable the form or queue other processes while in flight, e.g. disable manual submits while an autosave is running.
   */
  const [backgroundProcessing, _setBackgroundProcessing] = useState(false)

  /**
   * Intercept the `setBackgroundProcessing` method to keep the ref in sync.
   * See the `backgroundProcessingRef` for more details.
   */
  const setBackgroundProcessing = useCallback((backgroundProcessing: boolean) => {
    backgroundProcessingRef.current = backgroundProcessing
    _setBackgroundProcessing(backgroundProcessing)
  }, [])

  const submitFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (processing) {
      return
    }

    const previousFocus = submitFocusRef.current

    submitFocusRef.current = null
    if (
      previousFocus?.isConnected &&
      document.activeElement === document.body &&
      !previousFocus.closest('[inert]') &&
      !previousFocus.matches(':disabled')
    ) {
      previousFocus.focus({ preventScroll: true })
    }
  }, [processing])

  const disabledFromPropsRef = useRef(disabledFromProps)

  disabledFromPropsRef.current = disabledFromProps

  const restoreRequestState = useCallback(() => {
    setProcessing(false)
    setDisabled(disabledFromPropsRef.current || false)
    setBackgroundProcessing(false)
  }, [setBackgroundProcessing])

  const executeSubmit = useCallback(
    async ({
      onResponse,
      options,
      requestContext,
    }: {
      onResponse: (args: { res: Response }) => void
      options?: SubmitOptions
      requestContext: QueueContext
    }) => {
      const {
        acceptValues = true,
        action: actionArg = action,
        context,
        disableFormWhileProcessing = true,
        disableSuccessStatus: disableSuccessStatusFromArgs,
        method: methodToUse = method,
        overrides: overridesFromArgs = {},
        skipValidation,
      } = options || {}

      const disableToast = disableSuccessStatusFromArgs ?? disableSuccessStatus

      modifiedWhileProcessingRef.current = false

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
        const toastID = promiseToast.valueOf()
        if (typeof toastID === 'number' || typeof toastID === 'string') {
          promiseToastID = toastID
        }
      }

      try {
        if (disableFormWhileProcessing) {
          const activeElement = document.activeElement

          // Disabling the active field drops browser focus to the body.
          submitFocusRef.current =
            activeElement instanceof HTMLElement && formRef.current?.contains(activeElement)
              ? activeElement
              : null
          setProcessing(true)
          setDisabled(true)
        }

        if (options?.submissionType === 'autosave') {
          setBackgroundProcessing(true)
        }

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

          await beforeSubmit.reduce(async (priorOnChange, beforeSubmitFn) => {
            await priorOnChange

            const result = await beforeSubmitFn({
              formState: serializableFormState,
            })

            revalidatedFormState = result
          }, Promise.resolve())

          if (!requestContext.isCurrent()) {
            return
          }

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
          skipValidation || disableValidationOnSubmit
            ? true
            : await contextRef.current.validateForm()

        if (!requestContext.isCurrent()) {
          return
        }

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
          for (const [key, value] of Object.entries(overrides)) {
            data[key] = value
          }

          onSubmit(contextRef.current.fields, data)
        }

        if (!hasFormSubmitAction) {
          // No action provided, so we should return. An example where this happens are lexical link drawers. Upon submitting the drawer, we
          // want to close it without submitting the form. Stuff like validation would be handled by lexical before this, through beforeSubmit
          setProcessing(false)
          setSubmitted(true)
          setDisabled(false)
          return
        }

        try {
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

          if (!requestContext.isCurrent()) {
            return
          }

          if (res.status < 400 && !modifiedWhileProcessingRef.current) {
            setModified(false)
          }
          modifiedWhileProcessingRef.current = false

          setDisabled(false)

          if (typeof handleResponse === 'function') {
            await handleResponse(res, successToast, errorToast)
            setProcessing(false)
            return
          }

          const contentType = res.headers.get('content-type')
          const isJSON = contentType && contentType.indexOf('application/json') !== -1

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let json: Record<string, any> = {}

          if (isJSON) {
            json = await res.json()
          }

          if (!requestContext.isCurrent()) {
            return
          }

          if (res.status < 400) {
            setSuccessfulSubmitCount((count) => count + 1)

            if (typeof onSuccess === 'function') {
              const newFormState = await onSuccess(json, {
                context,
                formState: serializableFormState,
              })

              if (!requestContext.isCurrent()) {
                return
              }

              if (newFormState) {
                dispatchFields({
                  type: 'MERGE_SERVER_STATE',
                  acceptValues,
                  prevStateRef: prevFormState,
                  serverState: newFormState,
                })
              }
            }

            setSubmitted(false)
            setProcessing(false)

            if (redirect) {
              void startRouteTransition(() => router.push(redirect))
            } else if (!disableToast) {
              successToast(json.message || t('general:submissionSuccessful'))
            }
          } else {
            setProcessing(false)
            setSubmitted(true)

            // When there was an error submitting a draft,
            // set the form state to unsubmitted, to not trigger visible form validation on changes after the failed submit.
            // Also keep the form as modified so the save button remains enabled for retry.
            if (overridesFromArgs['_status'] === 'draft') {
              setModified(true)

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

              const serverErrorAction = {
                type: 'ADD_SERVER_ERRORS' as const,
                errors: fieldErrors,
              }

              prevFormState.current = fieldReducer(prevFormState.current, serverErrorAction)
              dispatchFields(serverErrorAction)

              nonFieldErrors.forEach((err) => {
                // Pass overridesFromArgs (not the computed overrides) so a retry re-evaluates any function overrides against current fields.
                if (
                  onNonFieldError?.(
                    err,
                    () => void contextRef.current.submit({ overrides: overridesFromArgs }),
                  )
                ) {
                  return
                }
                errorToast(<FieldErrorsToast errorMessage={err.message || t('error:unknown')} />)
              })

              return
            }

            const message = errorMessages?.[res.status] || res?.statusText || t('error:unknown')

            errorToast(message)
          }

          return { formState: contextRef.current.fields, res }
        } catch (err) {
          if (!requestContext.isCurrent()) {
            return
          }

          console.error('Error submitting form', err) // eslint-disable-line no-console
          setProcessing(false)
          setSubmitted(true)
          setDisabled(false)
          errorToast(err.message)
        }
      } finally {
        if (requestContext.isCurrent()) {
          restoreRequestState()
        } else if (promiseToastID !== undefined) {
          toast.dismiss(promiseToastID)
        }
      }
    },
    [
      beforeSubmit,
      restoreRequestState,
      setBackgroundProcessing,
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
      t,
      i18n,
      validateDrafts,
      waitForAutocomplete,
      setModified,
      setSubmitted,
      onNonFieldError,
      contextRef,
      formRef,
      prevFormState,
      setIsValid,
    ],
  )

  const submit = useCallback<Submit>(
    async (options, event) => {
      event?.stopPropagation()
      event?.preventDefault()

      if (contextRef.current.disabled) {
        return
      }

      const requestScope = requestScopeRef.current
      let didSucceed = false
      const resultPromise = scheduleRequest({
        priority: requestPriority[options?.submissionType ?? 'submit'],
        run: (requestContext) =>
          executeSubmit({
            onResponse: ({ res }) => {
              didSucceed = res.ok
            },
            options,
            requestContext,
          }),
      })

      if (options?.submissionType !== 'autosave') {
        latestExplicitSubmitRef.current = resultPromise.then(
          () => didSucceed,
          () => didSucceed,
        )
      }

      const result = await resultPromise

      if (result.status === 'superseded' && options?.submissionType === 'autosave') {
        let explicitSubmit = latestExplicitSubmitRef.current
        let didExplicitSubmitSucceed = true

        while (explicitSubmit !== undefined) {
          didExplicitSubmitSucceed = await explicitSubmit
          if (explicitSubmit === latestExplicitSubmitRef.current) {
            break
          }
          explicitSubmit = latestExplicitSubmitRef.current
        }

        if (!didExplicitSubmitSucceed && requestScope === requestScopeRef.current) {
          options.onStaleRequest?.()
        }
      }

      return result.status === 'completed' ? result.value : undefined
    },
    [contextRef, executeSubmit, requestScopeRef, scheduleRequest],
  )

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

  return {
    backgroundProcessing,
    disabled,
    modified,
    processing,
    restoreRequestState,
    setBackgroundProcessing,
    setDisabled,
    setModified,
    setProcessing,
    setSubmitted,
    submit,
    submitted,
    successfulSubmitCount,
  }
}
