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

import type { QueueContext } from '../../hooks/useQueue.js'
import type { FieldAction, Context as FormContextType, FormProps, SubmitOptions } from './types.js'

import { FieldErrorsToast } from '../../elements/Toasts/fieldErrors.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useFormErrorHandler } from '../../providers/FormErrorHandler/index.js'
import { useOperation } from '../../providers/Operation/index.js'
import { useRouter } from '../../providers/RouterAdapter/index.js'
import { useRouteTransition } from '../../providers/RouteTransition/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { requests } from '../../utilities/api.js'
import { errorMessages } from './errorMessages.js'
import { fieldReducer } from './fieldReducer.js'

type Args = {
  contextRef: RefObject<FormContextType>
  dispatchFieldsWithoutIncrementingFormSequence: Dispatch<FieldAction>
  formRef: RefObject<HTMLFormElement | null>
  formSequenceRef: RefObject<number>
  isMountedRef: RefObject<boolean>
  prevFormStateRef: RefObject<FormState>
  props: FormProps
  resetSequenceRef: RefObject<number>
  setIsValid: FormContextType['setIsValid']
  setModifiedWithoutTracking: FormContextType['setModified']
  validateForm: (isCurrentRequest?: () => boolean) => Promise<boolean>
}

export const useFormSubmission = ({
  contextRef,
  dispatchFieldsWithoutIncrementingFormSequence,
  formRef,
  formSequenceRef,
  isMountedRef,
  prevFormStateRef,
  props,
  resetSequenceRef,
  setIsValid,
  setModifiedWithoutTracking: _setModified,
  validateForm,
}: Args) => {
  const {
    action,
    beforeSubmit,
    disabled: disabledFromProps,
    disableSuccessStatus,
    disableValidationOnSubmit,
    handleResponse,
    isDocumentForm,
    onSubmit,
    onSuccess,
    redirect,
    submitted: submittedFromProps,
    waitForAutocomplete,
  } = props
  const method = 'method' in props ? props?.method : undefined
  const { collectionSlug, docConfig } = useDocumentInfo()
  const validateDrafts = hasDraftValidationEnabled(docConfig)
  const operation = useOperation()
  const router = useRouter()
  const { startRouteTransition } = useRouteTransition()
  const { i18n, t } = useTranslation()
  const onNonFieldError = useFormErrorHandler()

  const [disabled, _setDisabled] = useState(disabledFromProps || false)

  const disabledRef = useRef(disabled)

  const setDisabled = useCallback((disabled: boolean) => {
    disabledRef.current = disabled
    _setDisabled(disabled)
  }, [])

  const disabledFromPropsRef = useRef(Boolean(disabledFromProps))

  disabledFromPropsRef.current = Boolean(disabledFromProps)

  const [submitted, setSubmitted] = useState(false)

  const [successfulSubmitCount, setSuccessfulSubmitCount] = useState(0)

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

  const submissionErrorsRef = useRef<
    | {
        fields: FormState
        /** Returns whether these errors still belong to the current form state and form instance. */
        isCurrent: () => boolean
      }
    | undefined
  >(undefined)

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
        skipValidation,
        submissionType,
      } = options || {}

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
        const activeElement = document.activeElement

        // Disabling the active field drops browser focus to the body.
        submitFocusRef.current =
          activeElement instanceof HTMLElement && formRef.current?.contains(activeElement)
            ? activeElement
            : null
        setProcessing(true)
        setDisabled(true)
      }

      if (submissionType === 'autosave') {
        setBackgroundProcessing(true)
      }

      try {
        if (waitForAutocomplete) {
          await wait(100)

          // Autocomplete updates happen before the data snapshot and belong to this submission.
          const dispatchedSequence = formSequenceRef.current
          const { isQueueReset } = requestContext

          requestContext = {
            isCurrent: () => !isQueueReset() && formSequenceRef.current === dispatchedSequence,
            isQueueReset,
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
            await handleResponse(res, successToast, errorToast)
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
          const hasCreatedDocument = Boolean(
            isDocumentForm &&
            collectionSlug &&
            operation === 'create' &&
            (json?.doc || json?.result)?.id != null,
          )

          const shouldHandleStaleSuccess =
            hasCreatedDocument || (isDocumentForm && submissionType !== 'autosave')

          // Document forms still record explicit saves when newer edits make the response values stale.
          if (
            !requestContext.isCurrent() &&
            (!shouldHandleStaleSuccess || requestContext.isQueueReset())
          ) {
            // Completed explicit saves still count when newer edits prevent merging their values.
            // Autosaves reconcile stale submissions through onStaleRequest instead.
            return submissionType !== 'autosave' && !requestContext.isQueueReset()
              ? { res }
              : undefined
          }

          let newFormState: FormState | void
          const successSequence = formSequenceRef.current
          const successResetSequence = resetSequenceRef.current

          if (requestContext.isCurrent() || hasCreatedDocument) {
            setSuccessfulSubmitCount((count) => count + 1)
          }

          if (typeof onSuccess === 'function') {
            newFormState = await onSuccess(json, {
              context,
              formState: serializableFormState,
              isCurrent: requestContext.isCurrent,
              isQueueReset: requestContext.isQueueReset,
              submissionType,
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
            return submissionType !== 'autosave' && !requestContext.isQueueReset()
              ? { res }
              : undefined
          }

          preservePromiseToast = true
          submissionErrorsRef.current = undefined

          if (newFormState) {
            dispatchFieldsWithoutIncrementingFormSequence({
              type: 'MERGE_SERVER_STATE',
              acceptValues,
              prevStateRef: prevFormStateRef,
              serverState: newFormState,
            })
          }

          _setModified(false)
          setSubmitted(false)

          if (redirect) {
            if (requestContext.isCurrent()) {
              void startRouteTransition(() => router.push(redirect))
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

            const serverErrorAction = {
              type: 'ADD_SERVER_ERRORS' as const,
              errors: fieldErrors,
            }

            prevFormStateRef.current = fieldReducer(prevFormStateRef.current, serverErrorAction)
            dispatchFieldsWithoutIncrementingFormSequence(serverErrorAction)
            submissionErrorsRef.current = {
              fields: contextRef.current.fields,
              isCurrent: requestContext.isCurrent,
            }

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

        if (!requestContext.isQueueReset()) {
          if (submissionType === 'autosave') {
            setBackgroundProcessing(false)
          }

          setProcessing(false)
          setDisabled(disabledFromPropsRef.current)

          if (submissionType === 'autosave' && !requestContext.isCurrent()) {
            onStaleRequest?.()
          }
        }
      }
    },
    [
      beforeSubmit,
      collectionSlug,
      isDocumentForm,
      operation,
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
      contextRef,
      formRef,
      formSequenceRef,
      isMountedRef,
      prevFormStateRef,
      resetSequenceRef,
      setIsValid,
      _setModified,
    ],
  )

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

  return {
    backgroundProcessing,
    disabled,
    disabledRef,
    executeSubmit,
    processing,
    restoreRequestState,
    setBackgroundProcessing,
    setDisabled,
    setProcessing,
    setSubmitted,
    submissionErrorsRef,
    submitted,
    successfulSubmitCount,
  }
}
