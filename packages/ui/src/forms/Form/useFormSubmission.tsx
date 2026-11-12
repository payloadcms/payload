'use client'

import type { FormState, ValidationFieldError } from 'payload'
import type { Dispatch, RefObject } from 'react'

import { dequal } from 'dequal/lite'
import {
  deepCopyObjectSimpleWithoutReactComponents,
  getDataByPath,
  hasDraftValidationEnabled,
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
import type { UseFormStateResult } from './useFormState.js'

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
  prevFormStateRef: RefObject<FormState>
  props: FormProps
  queueTask: UseQueueResult['queueTask']
  refreshFormState: UseFormStateResult['refreshFormState']
  setIsValid: UseFormStateResult['setIsValid']
  setModified: UseFormStateResult['setModified']
  validateForm: UseFormStateResult['validateForm']
}

/**
 * Supplies Form's `submit` method and tracks submission status, processing, and disabling during a save.
 * Validates and refreshes form state around the submission, then handles callbacks, errors, toasts, and redirects.
 * Forms with an `onSubmit` callback can commit values locally without sending a save request.
 *
 * @example
 * const { submit, processing, submitted } = useFormSubmission(args)
 *
 * await submit()
 * await submit({ overrides: { _status: 'draft' } })
 */
export const useFormSubmission = ({
  contextRef,
  dispatchFields,
  formRef,
  prevFormStateRef,
  props,
  queueTask,
  refreshFormState,
  setIsValid,
  setModified,
  validateForm,
}: Args) => {
  const {
    action,
    beforeSubmit,
    disabled: isDisabledFromProps,
    disableSuccessStatus,
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

  const [disabledBySubmission, _setDisabledBySubmission] = useState(false)

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
      contextRef.current.submitted = isSubmitted
      _setIsSubmitted(isSubmitted)
    },
    [contextRef],
  )

  const setDisabledBySubmission = useCallback(
    (isDisabled: boolean) => {
      // The submit guard reads this before React renders the updated disabled state.
      contextRef.current.disabled = Boolean(isDisabledFromPropsRef.current || isDisabled)
      _setDisabledBySubmission(isDisabled)
    },
    [contextRef],
  )

  /**
   * Intercept the `setIsModified` method to track whether the event happened during background processing.
   * See the `isModifiedWhileProcessing` ref for more details.
   */
  const setIsModified = useCallback(
    (isModified: boolean) => {
      if (isBackgroundProcessingRef.current) {
        isModifiedWhileProcessing.current = true
      }

      setModified(isModified)
    },
    [setModified],
  )

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
    setDisabledBySubmission(false)
    setIsBackgroundProcessing(false)
  }, [setIsBackgroundProcessing, setDisabledBySubmission])

  const applyFieldErrors = useCallback(
    ({ errors }: { errors: ValidationFieldError[] }) => {
      if (errors.length === 0) {
        return
      }

      const action: FieldAction = { type: 'ADD_SERVER_ERRORS', errors }

      prevFormStateRef.current = fieldReducer(prevFormStateRef.current, action)
      dispatchFields(action)
    },
    [dispatchFields, prevFormStateRef],
  )

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

        const serializableFormState = deepCopyObjectSimpleWithoutReactComponents(
          contextRef.current.fields,
          {
            excludeFiles: true,
          },
        )

        let didRefreshFormState = false
        let res
        let rejectedFields: FormState | undefined
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let json: Record<string, any> = {}

        try {
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
              rejectedFields = revalidatedFormState

              if (hasFormSubmitAction) {
                prevFormStateRef.current = revalidatedFormState
              }

              setIsSubmitted(true)
              return dispatchFields({ type: 'REPLACE_STATE', state: revalidatedFormState })
            }
          }

          const validation = await validateForm({
            isCurrent: requestContext.isCurrent,
            isLocalSubmission: Boolean(onSubmit && !hasFormSubmitAction),
            skipValidation,
          })

          didRefreshFormState = validation.didRefreshFormState

          const { data, fields, isValid } = validation

          if (!requestContext.isCurrent()) {
            return
          }

          if (hasFormSubmitAction) {
            // Submission completion refreshes this state; validation updates must not queue another refresh.
            prevFormStateRef.current = fields
          }

          if (!isValid) {
            rejectedFields = fields
            errorToast(t('error:correctInvalidFields'))
            setIsSubmitted(true)
            return
          }

          let overrides = {}

          if (typeof overridesFromArgs === 'function') {
            overrides = overridesFromArgs(fields)
          } else if (typeof overridesFromArgs === 'object') {
            overrides = overridesFromArgs
          }

          // If submit handler comes through via props, run that
          if (onSubmit) {
            for (const [key, value] of Object.entries(overrides)) {
              data[key] = value
            }

            onSubmit(fields, data)
          }

          if (!hasFormSubmitAction) {
            setIsSubmitted(true)
            return
          }

          const formData = await contextRef.current.createFormData(overrides, {
            data,
            mergeOverrideData: Boolean(typeof overridesFromArgs !== 'function'),
          })

          if (!requestContext.isCurrent()) {
            return
          }

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
            if (res.status < 400 && !isModifiedWhileProcessing.current) {
              setIsModified(false)
            }

            isModifiedWhileProcessing.current = false
          }

          if (typeof handleResponse !== 'function') {
            const contentType = res.headers.get('content-type')
            const isJSON = contentType && contentType.indexOf('application/json') !== -1

            if (isJSON) {
              json = await res.json()
            }
          }
        } finally {
          const isSuccessfulResponse = res?.status < 400

          if (requestContext.isCurrent() && (hasFormSubmitAction || !didRefreshFormState)) {
            try {
              // Refresh before applying save errors so the refresh cannot erase them.
              await refreshFormState(
                isSuccessfulResponse && typeof handleResponse !== 'function'
                  ? {
                      type: 'afterSave',
                      acceptValues,
                      isCurrent: requestContext.isCurrent,
                      refreshPermissions: context?.getDocPermissions !== false,
                      savedDocument: json?.doc ?? json?.result,
                    }
                  : { type: 'refresh', isCurrent: requestContext.isCurrent },
              )
            } catch (err) {
              if (isSuccessfulResponse) {
                // Persistence succeeded; a refresh failure must not turn this into a failed save.
                toast.error(err instanceof Error ? err.message : t('error:unknown'))
              } else {
                console.error('Error refreshing form state', err) // eslint-disable-line no-console
              }
            }
          }

          if (rejectedFields && requestContext.isCurrent()) {
            const rejectedState = rejectedFields

            applyFieldErrors({
              errors: Object.entries(rejectedState).flatMap(([path, field]) => {
                const currentField = contextRef.current.fields[path]

                if (
                  field.valid !== false ||
                  !currentField ||
                  currentField.passesCondition === false
                ) {
                  return []
                }

                const rejectedValue = Array.isArray(field.rows)
                  ? getDataByPath(rejectedState, path)
                  : field.value
                const currentValue = Array.isArray(currentField.rows)
                  ? contextRef.current.getDataByPath(path)
                  : currentField.value

                return dequal(rejectedValue, currentValue)
                  ? [{ message: field.errorMessage ?? '', path }]
                  : []
              }),
            })
          }
        }

        if (res.status >= 400 && !requestContext.isCurrent()) {
          return
        }

        if (typeof handleResponse === 'function') {
          if (!requestContext.isCurrent()) {
            if (res.status < 400) {
              preservePromiseToast = true

              if (!disableToast) {
                successToast(t('general:submissionSuccessful'))
              }
            }

            return
          }

          preservePromiseToast = true

          await handleResponse(res, successToast, errorToast)

          return
        }

        if (res.status < 400) {
          if (requestContext.isCurrent()) {
            setSuccessfulSubmitCount((count) => count + 1)
          }

          if (typeof onSuccess === 'function') {
            try {
              await onSuccess(json, {
                context,
                formState: serializableFormState,
                isCurrent: requestContext.isCurrent,
              })
            } catch (err) {
              toast.error(err instanceof Error ? err.message : t('error:unknown'))
            }
          }

          // The save succeeded even if `onSuccess` reset or unmounted the form, so always settle the toast.
          preservePromiseToast = true

          if (requestContext.isCurrent()) {
            setIsSubmitted(false)
          }

          if (redirect && requestContext.isCurrent()) {
            void startRouteTransition(() => router.push(redirect))
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

            applyFieldErrors({ errors: fieldErrors })

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

        errorToast(err instanceof Error ? err.message : t('error:unknown'))
      } finally {
        if (requestContext.isCurrent()) {
          // Only put back what this submission took: an autosave must not release a queued save's disable.
          if (disableFormWhileProcessing) {
            setIsProcessing(false)
            setDisabledBySubmission(false)
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
      applyFieldErrors,
      beforeSubmit,
      setIsBackgroundProcessing,
      startRouteTransition,
      action,
      disableSuccessStatus,
      dispatchFields,
      handleResponse,
      method,
      onSubmit,
      onSuccess,
      redirect,
      refreshFormState,
      validateForm,
      router,
      t,
      i18n,
      validateDrafts,
      waitForAutocomplete,
      setDisabledBySubmission,
      setIsModified,
      setIsSubmitted,
      onNonFieldError,
      contextRef,
      prevFormStateRef,
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
        setDisabledBySubmission(true)
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
    [contextRef, executeSubmit, formRef, queueTask, setDisabledBySubmission],
  )

  useEffect(() => {
    if (typeof isSubmittedFromProps === 'boolean') {
      setIsSubmitted(isSubmittedFromProps)
    }
  }, [isSubmittedFromProps, setIsSubmitted])

  return {
    backgroundProcessing: isBackgroundProcessing,
    disabledBySubmission,
    processing: isProcessing,
    restoreRequestState,
    setBackgroundProcessing: setIsBackgroundProcessing,
    setDisabled: setDisabledBySubmission,
    setModified: setIsModified,
    setProcessing: setIsProcessing,
    setSubmitted: setIsSubmitted,
    submit,
    submitted: isSubmitted,
    successfulSubmitCount,
  }
}
