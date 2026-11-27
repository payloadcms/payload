'use client'

import type { FormState, ValidationFieldError } from 'payload'
import type { Dispatch, RefObject } from 'react'

import { dequal } from 'dequal/lite'
import {
  deepCopyObjectSimpleWithoutReactComponents,
  getDataByPath,
  hasDraftValidationEnabled,
  parseErrorResponse,
  wait,
} from 'payload/shared'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'

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
import { useLocale } from '../../providers/Locale/index.js'
import { useOperation } from '../../providers/Operation/index.js'
import { useRouter } from '../../providers/RouterAdapter/index.js'
import { useRouteTransition } from '../../providers/RouteTransition/index.js'
import { useServerFunctions } from '../../providers/ServerFunctions/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { createProgressToast } from '../../providers/UploadSessions/browser.js'
import {
  UploadContinuesInBackgroundError,
  useOptionalUploadSessions,
} from '../../providers/UploadSessions/index.js'
import { requests } from '../../utilities/api.js'
import { isSameOriginURL, uploadRequest } from '../../utilities/uploadRequest.js'
import { errorMessages } from './errorMessages.js'
import { fieldReducer } from './fieldReducer.js'
import { requestPriority } from './requestPriority.js'
import { abandonSaveUploadProgress, trackSaveUploadProgress } from './trackSaveUploadProgress.js'

type Args = {
  contextRef: RefObject<FormContextType>
  dispatchFields: Dispatch<FieldAction>
  formRef: RefObject<HTMLFormElement | null>
  getFormSequence: UseFormStateResult['getFormSequence']
  isMountedRef: RefObject<boolean>
  prevFormStateRef: RefObject<FormState>
  props: FormProps
  queueFormStateRefresh: UseFormStateResult['queueFormStateRefresh']
  queueTask: UseQueueResult['queueTask']
  refreshFormState: UseFormStateResult['refreshFormState']
  resetSequenceRef: RefObject<number>
  setIsValid: UseFormStateResult['setIsValid']
  setModified: UseFormStateResult['setModified']
  submissionErrorsRef: UseFormStateResult['submissionErrorsRef']
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
  getFormSequence,
  isMountedRef,
  prevFormStateRef,
  props,
  queueFormStateRefresh,
  queueTask,
  refreshFormState,
  resetSequenceRef,
  setIsValid,
  setModified: setIsModified,
  submissionErrorsRef,
  validateForm,
}: Args) => {
  const {
    action,
    beforeSubmit,
    disabled: isDisabledFromProps,
    disableSuccessStatus,
    handleResponse,
    isDocumentForm,
    onSubmit,
    onSuccess,
    redirect,
    submitted: isSubmittedFromProps,
    waitForAutocomplete,
  } = props

  const {
    id,
    collectionSlug,
    docConfig,
    docPermissions,
    getDocPreferences,
    globalSlug,
    setUploadProgress,
  } = useDocumentInfo()
  const locale = useLocale()?.code
  const operation = useOperation()
  const { getFormState } = useServerFunctions()
  const uploadSessions = useOptionalUploadSessions()
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
  const [isBackgroundProcessing, setIsBackgroundProcessing] = useState(false)

  const latestExplicitSubmitRef = useRef<Promise<boolean> | undefined>(undefined)
  /** The tracker of the save that is uploading a file, so a form reset can stop it. */
  const activeSaveUploadRef = useRef<ReturnType<typeof trackSaveUploadProgress> | undefined>(
    undefined,
  )
  /** That save's own progress toast, when it has no "Submitting…" toast, so a reset can remove it. */
  const activeUploadToastRef = useRef<ReturnType<typeof createProgressToast<string>> | undefined>(
    undefined,
  )
  /**
   * Validates the document on the server without saving it. The `file` field is skipped because
   * its bytes are being uploaded separately and are never part of the form state sent here.
   * When the server cannot validate, `unavailableMessage` is returned instead of errors, so the
   * save stops rather than storing data that was never validated.
   */
  const getServerValidationErrors = useCallback(
    async ({
      formState,
    }: {
      formState: FormState
    }): Promise<{ errors: ValidationFieldError[] } | { unavailableMessage: string }> => {
      const result = await getFormState({
        id,
        collectionSlug,
        docPermissions,
        docPreferences: await getDocPreferences(),
        formState,
        globalSlug,
        locale,
        operation,
        schemaPath: collectionSlug ? collectionSlug : globalSlug,
        skipValidation: false,
      })

      if (!result?.state) {
        return {
          unavailableMessage:
            result && 'message' in result && result.message ? result.message : t('error:unknown'),
        }
      }

      return {
        errors: Object.entries(result.state)
          .filter(([path, field]) => path !== 'file' && field.valid === false)
          .map(([path, field]) => ({ message: field.errorMessage ?? t('error:unknown'), path })),
      }
    },
    [
      collectionSlug,
      docPermissions,
      getDocPreferences,
      getFormState,
      globalSlug,
      id,
      locale,
      operation,
      t,
    ],
  )

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
    // A reset invalidates the running save, but its upload can still be sending. Its progress is
    // cleared now rather than when the upload ends, so Save is not held disabled until then.
    abandonSaveUploadProgress({ setUploadProgress, upload: activeSaveUploadRef.current })
    activeSaveUploadRef.current = undefined
    dismissLoadingUploadToast({ uploadToast: activeUploadToastRef.current })
    activeUploadToastRef.current = undefined
  }, [setIsBackgroundProcessing, setDisabledBySubmission, setUploadProgress])

  // Once the form unmounts, its save no longer owns `uploadProgress`, so later reports are ignored.
  // A save that continues in the background shows its result in the upload session's own toast.
  useEffect(
    () => () => {
      abandonSaveUploadProgress({ setUploadProgress, upload: activeSaveUploadRef.current })
      activeSaveUploadRef.current = undefined
      dismissLoadingUploadToast({ uploadToast: activeUploadToastRef.current })
      activeUploadToastRef.current = undefined
    },
    [setUploadProgress],
  )

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
      onRefresh,
      onResponse,
      options,
      requestContext,
    }: {
      onRefresh: () => void
      onResponse: (args: { res?: Response }) => void
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
        onStaleRequest,
        overrides: overridesFromArgs = {},
        skipValidation,
        submissionType,
      } = options || {}

      const disableToast = disableSuccessStatusFromArgs ?? disableSuccessStatus

      // create new toast promise which will resolve manually later
      let errorToast, successToast
      let promiseToastID: number | string | undefined
      let saveUpload: ReturnType<typeof trackSaveUploadProgress> | undefined
      // A save's own progress toast when it has no "Submitting…" toast to show progress in.
      let uploadToast: ReturnType<typeof createProgressToast<string>> | undefined
      let preservePromiseToast = false
      // Only the first result replaces the progress toast. A later one, such as a second error,
      // gets a toast of its own so it does not replace the first.
      let hasShownUploadResult = false
      const getResultToastOptions = () => {
        if (!uploadToast || hasShownUploadResult) {
          return undefined
        }

        hasShownUploadResult = true

        return { id: uploadToast.getResultID() }
      }

      const promise = new Promise((resolve, reject) => {
        successToast = resolve
        errorToast = reject
      })

      const hasFormSubmitAction =
        actionArg || typeof action === 'string' || typeof action === 'function'

      if (redirect || disableToast || !hasFormSubmitAction) {
        // Do not show submitting toast, as the promise toast may never disappear under these conditions.
        // Instead, make successToast() or errorToast() throw toast.success / toast.error
        successToast = (data) => toast.success(data, getResultToastOptions())
        errorToast = (data) => toast.error(data, getResultToastOptions())
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

          // Autocomplete updates happen before the data snapshot and belong to this submission.
          const dispatchedSequence = getFormSequence()
          const { isQueueReset } = requestContext

          requestContext = {
            isCurrent: () => !isQueueReset() && getFormSequence() === dispatchedSequence,
            isQueueReset,
          }
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
        let serverValidationErrors: ValidationFieldError[] = []
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
          if (didRefreshFormState) {
            onRefresh()
          }

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

          // Document forms leave validation to the server, which would only answer after a large
          // upload finishes. Ask it now so field errors show immediately while the upload continues.
          const isWaitingOnUpload =
            data?.file instanceof File &&
            Boolean(
              uploadSessions?.willSaveWaitForUpload({
                docPrefix: typeof data.prefix === 'string' ? data.prefix : undefined,
                file: data.file,
              }),
            )

          if (isWaitingOnUpload && !skipValidation) {
            const serverValidation = await getServerValidationErrors({
              // Validates what the save submits, such as the `_status` that Publish adds.
              formState: applyOverridesToFormState({ formState: serializableFormState, overrides }),
            })

            if (!requestContext.isCurrent()) {
              return
            }

            // The save stops so the user can retry; the upload keeps going meanwhile.
            if ('unavailableMessage' in serverValidation) {
              errorToast(serverValidation.unavailableMessage)
              setIsSubmitted(true)
              return
            }

            if (serverValidation.errors.length) {
              // Applied after the refresh below, so the refresh cannot erase them.
              serverValidationErrors = serverValidation.errors
              setIsValid(false)
              errorToast(t('error:correctInvalidFields'))
              setIsSubmitted(true)
              return
            }
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

          const uploadFile = contextRef.current.fields?.file?.value

          if (uploadFile instanceof File) {
            if (promiseToastID === undefined) {
              uploadToast = createProgressToast({ id: `save-upload-${uuidv4()}` })
            }

            saveUpload = trackSaveUploadProgress({
              fileName: uploadFile.name,
              onChange: setUploadProgress,
              progressToast:
                uploadToast ??
                // The same id, not its string: Sonner matches ids strictly.
                createProgressToast({ id: promiseToastID }),
              t,
              totalBytes: uploadFile.size,
            })
            activeSaveUploadRef.current = saveUpload
            activeUploadToastRef.current = uploadToast
          }

          const formData = await contextRef.current.createFormData(overrides, {
            action: typeof actionArg === 'string' ? actionArg : undefined,
            data,
            mergeOverrideData: Boolean(typeof overridesFromArgs !== 'function'),
            onUploadProgress: saveUpload?.report,
          })

          if (!requestContext.isCurrent()) {
            return
          }

          // Only a URL action has a method; a function action may have none.
          const uploadMethod =
            typeof actionArg === 'string' ? methodToUse?.toUpperCase() : undefined

          if (
            typeof actionArg === 'string' &&
            formData.get('file') instanceof Blob &&
            (uploadMethod === 'PATCH' || uploadMethod === 'POST' || uploadMethod === 'PUT') &&
            isSameOriginURL({ url: actionArg })
          ) {
            // The file is in this request, so it reports how much of it is sent.
            res = await uploadRequest({
              body: formData,
              headers: {
                'Accept-Language': i18n.language,
              },
              method: uploadMethod,
              onProgress: saveUpload?.report,
              url: actionArg,
              withCredentials: true,
            })
          } else if (typeof actionArg === 'string') {
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
            // A replaced save leaves the progress to the newer one; `finally` stops it.
            saveUpload?.settle({ isSuccessful: res?.status < 400 })
          }

          onResponse({ res })

          if (typeof handleResponse !== 'function') {
            const contentType = res.headers.get('content-type')
            const isJSON = contentType && contentType.indexOf('application/json') !== -1

            if (isJSON) {
              json = await res.json()
            }
          }

          if (
            res.status < 400 &&
            (requestContext.isCurrent() ||
              (isDocumentForm &&
                collectionSlug &&
                operation === 'create' &&
                (json?.doc ?? json?.result)?.id != null))
          ) {
            setSuccessfulSubmitCount((count) => count + 1)
          }
        } finally {
          const isSuccessfulResponse = res?.status < 400

          if (isSuccessfulResponse && requestContext.isCurrent()) {
            submissionErrorsRef.current = undefined
          }

          if (requestContext.isCurrent() && (hasFormSubmitAction || !didRefreshFormState)) {
            try {
              // Refresh before applying save errors so the refresh cannot erase them.
              const refreshedFields = await refreshFormState(
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
              if (refreshedFields) {
                onRefresh()
              }
            } catch (err) {
              if (isSuccessfulResponse) {
                // Persistence succeeded; a refresh failure must not turn this into a failed save.
                if (requestContext.isCurrent()) {
                  toast.error(err instanceof Error ? err.message : t('error:unknown'))
                }
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
            submissionErrorsRef.current = {
              fields: contextRef.current.fields,
              isCurrent: requestContext.isCurrent,
            }
          }

          if (serverValidationErrors.length && requestContext.isCurrent()) {
            applyFieldErrors({ errors: serverValidationErrors })
            submissionErrorsRef.current = {
              fields: contextRef.current.fields,
              isCurrent: requestContext.isCurrent,
            }
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

          if (res.status < 400) {
            setIsModified(false)
          }

          await handleResponse(res, successToast, errorToast)

          return
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

          const successSequence = getFormSequence()
          const successResetSequence = resetSequenceRef.current

          if (typeof onSuccess === 'function') {
            try {
              await onSuccess(json, {
                context,
                formState: serializableFormState,
                isCurrent: requestContext.isCurrent,
                isQueueReset: requestContext.isQueueReset,
              })
            } catch (err) {
              if (requestContext.isCurrent()) {
                toast.error(err instanceof Error ? err.message : t('error:unknown'))
              }
            }
          }

          if (!requestContext.isCurrent()) {
            // A successful drawer callback can unmount the form before its toast resolves.
            if (
              !isMountedRef.current &&
              getFormSequence() === successSequence &&
              resetSequenceRef.current === successResetSequence + 1
            ) {
              preservePromiseToast = true
              if (!redirect && !disableToast) {
                successToast(json.message || t('general:submissionSuccessful'))
              }
              return { res }
            }
            return submissionType !== 'autosave' && !requestContext.isQueueReset()
              ? { res }
              : undefined
          }

          preservePromiseToast = true

          setIsModified(false)
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
            const { fieldErrors, nonFieldErrors } = parseErrorResponse({ body: json })

            setIsValid(false)

            applyFieldErrors({ errors: fieldErrors })
            submissionErrorsRef.current = {
              fields: contextRef.current.fields,
              isCurrent: requestContext.isCurrent,
            }

            nonFieldErrors.forEach((error) => {
              const err = {
                ...error,
                message: typeof error.message === 'string' ? error.message : t('error:unknown'),
              }

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
        // The form unmounted during a large upload; the upload coordinator finishes the save.
        if (err instanceof UploadContinuesInBackgroundError) {
          saveUpload?.settle({ isSuccessful: true })
          preservePromiseToast = true
          successToast(t('upload:savingInBackground'))
          return
        }

        const isCurrentRequest = requestContext.isCurrent()

        if (isCurrentRequest) {
          saveUpload?.settle({ isSuccessful: false })
        }

        if (!preservePromiseToast && !isCurrentRequest) {
          return
        }

        console.error('Error submitting form', err) // eslint-disable-line no-console

        if (isCurrentRequest) {
          setIsSubmitted(true)
        }

        errorToast(err instanceof Error ? err.message : t('error:unknown'))
      } finally {
        if (!requestContext.isQueueReset()) {
          // Only put back what this submission took: an autosave must not release a queued save's disable.
          if (disableFormWhileProcessing) {
            setIsProcessing(false)
            setDisabledBySubmission(false)
          }

          if (options?.submissionType === 'autosave') {
            setIsBackgroundProcessing(false)
            if (!requestContext.isCurrent()) {
              onStaleRequest?.()
            }
          }
        }
        if (!requestContext.isCurrent() && !preservePromiseToast && promiseToastID !== undefined) {
          toast.dismiss(promiseToastID)
        }

        // A save that ended without a result, e.g. one replaced by a newer save, must not leave
        // `uploadStatus` at `uploading`.
        abandonSaveUploadProgress({ setUploadProgress, upload: saveUpload })

        if (activeSaveUploadRef.current === saveUpload) {
          activeSaveUploadRef.current = undefined
        }

        // Without a result toast, e.g. a create that redirects, the progress toast is removed.
        dismissLoadingUploadToast({ uploadToast })

        if (activeUploadToastRef.current === uploadToast) {
          activeUploadToastRef.current = undefined
        }
      }
    },
    [
      applyFieldErrors,
      getFormSequence,
      isMountedRef,
      resetSequenceRef,
      submissionErrorsRef,
      isDocumentForm,
      collectionSlug,
      operation,
      beforeSubmit,
      setIsBackgroundProcessing,
      setUploadProgress,
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
      getServerValidationErrors,
      uploadSessions,
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

      const resetSequence = resetSequenceRef.current
      let didRefreshFormState = false
      let didReceiveSuccessfulResponse = false
      const scheduledRequest = queueTask({
        priority: requestPriority[options?.submissionType ?? 'submit'],
        task: (requestContext) =>
          executeSubmit({
            onRefresh: () => {
              didRefreshFormState = true
            },
            onResponse: ({ res }) => {
              didReceiveSuccessfulResponse = Boolean(res?.ok)
            },
            options,
            requestContext,
          }),
      })

      if (options?.submissionType !== 'autosave') {
        latestExplicitSubmitRef.current = scheduledRequest.then(
          () => didReceiveSuccessfulResponse,
          () => didReceiveSuccessfulResponse,
        )
      }

      const result = await scheduledRequest

      // A superseded submission never runs, so release the disable it took.
      // Skip after a reset: it already restored request state, and a newer submission may own the disable.
      if (
        result.status === 'superseded' &&
        shouldDisableForm &&
        resetSequence === resetSequenceRef.current
      ) {
        setIsProcessing(false)
        setDisabledBySubmission(false)
      }

      // A failed submit may have displaced a refresh without returning replacement form state.
      if (
        result.status === 'completed' &&
        !didReceiveSuccessfulResponse &&
        !didRefreshFormState &&
        isMountedRef.current &&
        resetSequence === resetSequenceRef.current
      ) {
        queueFormStateRefresh({ force: true })
      }

      if (result.status === 'superseded' && options?.submissionType === 'autosave') {
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
    [
      contextRef,
      executeSubmit,
      formRef,
      queueTask,
      queueFormStateRefresh,
      resetSequenceRef,
      isMountedRef,
      setDisabledBySubmission,
    ],
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
    setProcessing: setIsProcessing,
    setSubmitted: setIsSubmitted,
    submit,
    submitted: isSubmitted,
    successfulSubmitCount,
  }
}

const applyOverridesToFormState = ({
  formState,
  overrides,
}: {
  formState: FormState
  overrides: object
}): FormState => {
  const formStateWithOverrides = { ...formState }

  for (const [path, value] of Object.entries(overrides)) {
    formStateWithOverrides[path] = { ...formState[path], value }
  }

  return formStateWithOverrides
}

/**
 * Removes a save's own progress toast while it still shows the upload. A result that already
 * replaced it stays.
 */
const dismissLoadingUploadToast = ({
  uploadToast,
}: {
  uploadToast?: ReturnType<typeof createProgressToast<string>>
}) => {
  const id = uploadToast?.getResultID()

  if (
    id !== undefined &&
    toast.getToasts().some((item) => item.id === id && 'type' in item && item.type === 'loading')
  ) {
    toast.dismiss(id)
  }
}
