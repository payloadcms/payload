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

import type { TaskContext, UseQueueResult } from '../../hooks/useQueue.js'
import type {
  FieldAction,
  Context as FormContextType,
  FormProps,
  Submit,
  SubmitOptions,
} from './types.js'
import type { FormStateRequests } from './useFormStateRequest.js'

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
  fetchFormState: FormStateRequests['fetchFormState']
  formRef: RefObject<HTMLFormElement | null>
  prevFormStateRef: RefObject<FormState>
  props: FormProps
  queueTask: UseQueueResult['queueTask']
  setIsValid: FormContextType['setIsValid']
  /** Kept in sync with the submitted state, for requests queued before React renders it. */
  submittedRef: RefObject<boolean>
}

export const useFormSubmission = ({
  contextRef,
  dispatchFields,
  fetchFormState,
  formRef,
  prevFormStateRef,
  props,
  queueTask,
  setIsValid,
  submittedRef,
}: Args) => {
  const {
    action,
    beforeSubmit,
    disabled: isDisabledFromProps,
    disableSuccessStatus,
    disableValidationOnSubmit,
    handleResponse,
    onSubmit,
    onSuccess,
    redirect,
    submitted: isSubmittedFromProps,
    waitForAutocomplete,
  } = props

  const { docConfig } = useDocumentInfo()
  const router = useRouter()
  const { startRouteTransition } = useRouteTransition()
  const { i18n, t } = useTranslation()
  const onNonFieldError = useFormErrorHandler()

  const [isModified, _setIsModified] = useState(false)

  const [isDisabled, _setIsDisabled] = useState(isDisabledFromProps || false)

  const [isSubmitted, _setIsSubmitted] = useState(false)

  const [successfulSubmitCount, setSuccessfulSubmitCount] = useState(0)

  const [isProcessing, setIsProcessing] = useState(false)

  /**
   * Determines whether the form is processing asynchronously in the background, e.g. autosave is running.
   * Useful to determine whether to disable the form or queue other processes while in flight, e.g. disable manual submits while an autosave is running.
   */
  const [isBackgroundProcessing, _setIsBackgroundProcessing] = useState(false)

  /**
   * A ref that can be read within the `setIsModified` interceptor.
   * Dependents of this state can read it immediately without needing to wait for a render cycle.
   */
  const isBackgroundProcessingRef = useRef(false)

  /**
   * Flag to track if the form was modified _during a submission_, e.g. while autosave is running.
   * Useful in order to avoid resetting `isModified` to false wrongfully after a submit.
   * For example, if the user modifies a field while the a background process (autosave) is running,
   * we need to ensure that after the submit completes, the `isModified` state remains true.
   */
  const isModifiedWhileProcessing = useRef(false)

  const submitFocus = useRef<HTMLElement | null>(null)
  const isDisabledFromPropsRef = useRef(isDisabledFromProps)

  isDisabledFromPropsRef.current = isDisabledFromProps

  const method = 'method' in props ? props?.method : undefined
  const validateDrafts = hasDraftValidationEnabled(docConfig)

  const setIsSubmitted = useCallback(
    (isSubmitted: boolean) => {
      submittedRef.current = isSubmitted
      _setIsSubmitted(isSubmitted)
    },
    [submittedRef],
  )

  const setIsDisabled = useCallback(
    (isDisabled: boolean) => {
      // The submit guard reads this before React renders the updated disabled state.
      contextRef.current.disabled = isDisabled
      _setIsDisabled(isDisabled)
    },
    [contextRef],
  )

  /**
   * Intercept the `setIsModified` method to track whether the event happened during background processing.
   * See the `isModifiedWhileProcessing` ref for more details.
   */
  const setIsModified = useCallback((isModified: boolean) => {
    if (isBackgroundProcessingRef.current) {
      isModifiedWhileProcessing.current = true
    }

    _setIsModified(isModified)
  }, [])

  /**
   * Intercept the `setIsBackgroundProcessing` method to keep the ref in sync.
   * See the `isBackgroundProcessingRef` ref for more details.
   */
  const setIsBackgroundProcessing = useCallback((isBackgroundProcessing: boolean) => {
    isBackgroundProcessingRef.current = isBackgroundProcessing
    _setIsBackgroundProcessing(isBackgroundProcessing)
  }, [])

  useEffect(() => {
    if (isProcessing) {
      return
    }

    const previousFocus = submitFocus.current

    submitFocus.current = null

    if (
      previousFocus?.isConnected &&
      document.activeElement === document.body &&
      !previousFocus.closest('[inert]') &&
      !previousFocus.matches(':disabled')
    ) {
      previousFocus.focus({ preventScroll: true })
    }
  }, [isProcessing])

  const restoreRequestState = useCallback(() => {
    setIsProcessing(false)
    setIsDisabled(isDisabledFromPropsRef.current || false)
    setIsBackgroundProcessing(false)
  }, [setIsBackgroundProcessing, setIsDisabled])

  const executeSubmit = useCallback(
    async ({
      options,
      requestContext,
    }: {
      options?: SubmitOptions
      requestContext: TaskContext
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

      isModifiedWhileProcessing.current = false

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

        const toastID = promiseToast.valueOf()

        if (typeof toastID === 'number' || typeof toastID === 'string') {
          promiseToastID = toastID
        }
      }

      try {
        if (options?.submissionType === 'autosave') {
          setIsBackgroundProcessing(true)
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
            setIsSubmitted(true)
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
          setIsSubmitted(true)
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
          setIsSubmitted(true)
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

          if (!requestContext.isCurrent()) {
            return
          }

          if (res.status < 400 && !isModifiedWhileProcessing.current) {
            setIsModified(false)
          }

          isModifiedWhileProcessing.current = false

          if (typeof handleResponse === 'function') {
            preservePromiseToast = true

            await handleResponse(res, successToast, errorToast)

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
              await onSuccess(json, {
                context,
                formState: serializableFormState,
              })
            }

            // Part of the submission, so the next one can't start before the saved document's state is applied.
            // Only after a success: a failed submission already applies its errors.
            await fetchFormState({
              acceptValues,
              isCurrent: requestContext.isCurrent,
              savedDocument: json?.doc ?? json?.result,
              submitted: false,
            })

            // The save succeeded even if `onSuccess` reset or unmounted the form, so always settle the toast.
            preservePromiseToast = true
            setIsSubmitted(false)

            if (redirect) {
              if (requestContext.isCurrent()) {
                void startRouteTransition(() => router.push(redirect))
              }
            } else if (!disableToast) {
              successToast(json.message || t('general:submissionSuccessful'))
            }
          } else {
            setIsSubmitted(true)

            // When there was an error submitting a draft,
            // set the form state to unsubmitted, to not trigger visible form validation on changes after the failed submit.
            // Also keep the form as modified so the save button remains enabled for retry.
            if (overridesFromArgs['_status'] === 'draft') {
              setIsModified(true)

              if (!validateDrafts) {
                setIsSubmitted(false)
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

              prevFormStateRef.current = fieldReducer(prevFormStateRef.current, serverErrorAction)
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
          const isCurrentRequest = requestContext.isCurrent()

          if (!preservePromiseToast && !isCurrentRequest) {
            return
          }

          console.error('Error submitting form', err) // eslint-disable-line no-console

          if (isCurrentRequest) {
            setIsSubmitted(true)
          }

          errorToast(err.message)
        }
      } finally {
        if (requestContext.isCurrent()) {
          // Only put back what this submission took: an autosave must not release a queued save's disable.
          if (disableFormWhileProcessing) {
            setIsProcessing(false)
            setIsDisabled(isDisabledFromPropsRef.current || false)
          }

          if (options?.submissionType === 'autosave') {
            setIsBackgroundProcessing(false)
          }
        } else if (!preservePromiseToast && promiseToastID !== undefined) {
          toast.dismiss(promiseToastID)
        }
      }
    },
    [
      beforeSubmit,
      setIsBackgroundProcessing,
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
      setIsDisabled,
      setIsModified,
      setIsSubmitted,
      onNonFieldError,
      contextRef,
      prevFormStateRef,
      fetchFormState,
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

      const shouldDisableForm = options?.disableFormWhileProcessing ?? true

      // Disable before queueing, like a direct submit, so the guard above rejects any submission made while this one waits.
      if (shouldDisableForm) {
        const activeElement = document.activeElement

        // Disabling the active field drops browser focus to the body.
        submitFocus.current =
          activeElement instanceof HTMLElement && formRef.current?.contains(activeElement)
            ? activeElement
            : null

        setIsProcessing(true)
        setIsDisabled(true)
      }

      // While a disabling submission waits, the guard above rejects every other submit, so only a reset can supersede it.
      // Every reset restores request state, so a superseded submission has nothing to release.
      const result = await queueTask({
        priority: requestPriority[options?.submissionType ?? 'submit'],
        task: (requestContext) => executeSubmit({ options, requestContext }),
      })

      if (result.status === 'completed') {
        return result.value
      }
    },
    [contextRef, executeSubmit, formRef, queueTask, setIsDisabled],
  )

  useEffect(() => {
    if (typeof isDisabledFromProps === 'boolean') {
      setIsDisabled(isDisabledFromProps)
    }
  }, [isDisabledFromProps, setIsDisabled])

  useEffect(() => {
    if (typeof isSubmittedFromProps === 'boolean') {
      setIsSubmitted(isSubmittedFromProps)
    }
  }, [isSubmittedFromProps, setIsSubmitted])

  return {
    backgroundProcessing: isBackgroundProcessing,
    disabled: isDisabled,
    modified: isModified,
    processing: isProcessing,
    restoreRequestState,
    setBackgroundProcessing: setIsBackgroundProcessing,
    setDisabled: setIsDisabled,
    setModified: setIsModified,
    setProcessing: setIsProcessing,
    setSubmitted: setIsSubmitted,
    submit,
    submitted: isSubmitted,
    successfulSubmitCount,
  }
}
