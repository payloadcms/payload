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

type Args = {
  contextRef: RefObject<FormContextType>
  dispatchFields: Dispatch<FieldAction>
  formRef: RefObject<HTMLFormElement | null>
  prevFormStateRef: RefObject<FormState>
  props: FormProps
  setIsValid: FormContextType['setIsValid']
  setModified: FormContextType['setModified']
}

/**
 * Provides Form's `submit` method and tracks submission status, processing, and disabling during a save.
 * Tracks edits made during background saves so they remain marked as unsaved.
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
  setIsValid,
  setModified,
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

  const [disabledBySubmission, _setDisabledBySubmission] = useState(false)

  const [isSubmitted, setIsSubmitted] = useState(false)

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

  const setDisabledBySubmission = useCallback(
    (isDisabled: boolean) => {
      contextRef.current.disabled = Boolean(isDisabledFromPropsRef.current || isDisabled)
      _setDisabledBySubmission(isDisabled)
    },
    [contextRef],
  )

  const method = 'method' in props ? props?.method : undefined
  const validateDrafts = hasDraftValidationEnabled(docConfig)

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

  const executeSubmit = useCallback(
    async (options?: SubmitOptions) => {
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

      try {
        if (disableFormWhileProcessing) {
          const activeElement = document.activeElement

          // Disabling the active field drops browser focus to the body.
          submitFocus.current =
            activeElement instanceof HTMLElement && formRef.current?.contains(activeElement)
              ? activeElement
              : null

          setIsProcessing(true)
          setDisabledBySubmission(true)
        }

        if (waitForAutocomplete) {
          await wait(100)
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

          if (res.status < 400 && !isModifiedWhileProcessing.current) {
            setIsModified(false)
          }

          isModifiedWhileProcessing.current = false

          if (typeof handleResponse === 'function') {
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

          if (res.status < 400) {
            setSuccessfulSubmitCount((count) => count + 1)

            if (typeof onSuccess === 'function') {
              const newFormState = await onSuccess(json, {
                context,
                formState: serializableFormState,
              })

              if (newFormState) {
                dispatchFields({
                  type: 'MERGE_SERVER_STATE',
                  acceptValues,
                  prevStateRef: prevFormStateRef,
                  serverState: newFormState,
                })
              }
            }

            setIsSubmitted(false)

            if (redirect) {
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
          console.error('Error submitting form', err) // eslint-disable-line no-console
          setIsSubmitted(true)
          errorToast(err.message)
        }
      } finally {
        setDisabledBySubmission(false)
        setIsProcessing(false)
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
      t,
      i18n,
      validateDrafts,
      waitForAutocomplete,
      setIsModified,
      onNonFieldError,
      contextRef,
      formRef,
      prevFormStateRef,
      setIsValid,
    ],
  )

  const submit = useCallback<Submit>(
    async (options, event) => {
      if (contextRef.current.disabled) {
        event?.preventDefault()
        return
      }

      event?.stopPropagation()
      event?.preventDefault()

      return executeSubmit(options)
    },
    [contextRef, executeSubmit],
  )

  useEffect(() => {
    if (typeof isSubmittedFromProps === 'boolean') {
      setIsSubmitted(isSubmittedFromProps)
    }
  }, [isSubmittedFromProps])

  return {
    backgroundProcessing: isBackgroundProcessing,
    disabledBySubmission,
    processing: isProcessing,
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
