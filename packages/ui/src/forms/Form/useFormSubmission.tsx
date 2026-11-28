'use client'

import type { Data, FormState, ValidationFieldError } from 'payload'
import type { Dispatch, FormEvent, RefObject } from 'react'

import {
  deepCopyObjectSimpleWithoutReactComponents,
  hasDraftValidationEnabled,
  parseErrorResponse,
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
import { useLocale } from '../../providers/Locale/index.js'
import { useOperation } from '../../providers/Operation/index.js'
import { useRouter } from '../../providers/RouterAdapter/index.js'
import { useRouteTransition } from '../../providers/RouteTransition/index.js'
import { useServerFunctions } from '../../providers/ServerFunctions/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import {
  UploadContinuesInBackgroundError,
  useOptionalUploadSessions,
} from '../../providers/UploadSessions/index.js'
import { requests } from '../../utilities/api.js'
import { errorMessages } from './errorMessages.js'
import { fieldReducer } from './fieldReducer.js'
import { requestPriority } from './requestPriority.js'
import { getMatchingFieldErrors } from './submissionErrors.js'

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

type SubmissionOutcome =
  | { error: unknown; type: 'failure' }
  | {
      errors: ValidationFieldError[]
      fields: FormState
      message?: string
      replaceState?: boolean
      type: 'validation'
    }
  | { json?: Data; res: Response; type: 'response' }
  | { type: 'background' }
  | { type: 'local' }
  | { type: 'superseded' }

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

  const { id, collectionSlug, docConfig, docPermissions, getDocPreferences, globalSlug } =
    useDocumentInfo()
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
      const isExplicitSubmit = submissionType !== 'autosave'
      const isActive = () => !requestContext.isQueueReset()
      const shouldReport = () => isActive() && (isExplicitSubmit || requestContext.isCurrent())
      const didCloseSavedForm = ({
        formSequence,
        resetSequence,
      }: {
        formSequence: number
        resetSequence: number
      }) =>
        !isMountedRef.current &&
        getFormSequence() === formSequence &&
        resetSequenceRef.current === resetSequence + 1
      const hasFormSubmitAction =
        actionArg || typeof action === 'string' || typeof action === 'function'

      let didRefreshFormState = false
      let submittedFields: FormState = {}
      let didSettleToast = false
      let allowDetachedToast = false
      let promiseToastID: number | string | undefined
      let resolveToast: (value: string) => void
      let rejectToast: (value: unknown) => void

      const successToast = (message: string) => {
        if (isActive() || allowDetachedToast) {
          didSettleToast = true
          resolveToast(message)
        }
      }
      const errorToast = (message: unknown) => {
        if (isActive()) {
          didSettleToast = true
          rejectToast(message)
        }
      }

      if (redirect || disableToast || !hasFormSubmitAction) {
        resolveToast = (message) => toast.success(message)
        rejectToast = (message) => toast.error(message as string)
      } else {
        const promise = new Promise<string>((resolve, reject) => {
          resolveToast = resolve
          rejectToast = reject
        })
        const promiseToast = toast.promise(promise, {
          error: (message) => message as string,
          loading: t('general:submitting'),
          success: (message) => message,
        })
        const toastID = promiseToast.valueOf()

        if (typeof toastID === 'number' || typeof toastID === 'string') {
          promiseToastID = toastID
        }
      }

      const recordFieldErrors = ({
        errors,
        fields,
      }: {
        errors: ValidationFieldError[]
        fields: FormState
      }) => {
        const applicableErrors = getMatchingFieldErrors({
          currentFields: contextRef.current.fields,
          errors,
          submittedFields: fields,
        })

        applyFieldErrors({ errors: applicableErrors })
        submissionErrorsRef.current = { errors: applicableErrors, fields, isActive }
      }

      const prepareSubmission = async (): Promise<SubmissionOutcome> => {
        if (waitForAutocomplete) {
          await wait(100)

          const dispatchedSequence = getFormSequence()
          const { isQueueReset } = requestContext

          requestContext = {
            isCurrent: () => !isQueueReset() && getFormSequence() === dispatchedSequence,
            isQueueReset,
          }
        }

        if (!requestContext.isCurrent()) {
          return { type: 'superseded' }
        }

        if (Array.isArray(beforeSubmit)) {
          const formState = deepCopyObjectSimpleWithoutReactComponents(contextRef.current.fields, {
            excludeFiles: true,
          })
          let revalidatedFormState = formState

          for (const beforeSubmitFn of beforeSubmit) {
            revalidatedFormState = await beforeSubmitFn({ formState })
          }

          if (!requestContext.isCurrent()) {
            return { type: 'superseded' }
          }

          const isValid = Object.values(revalidatedFormState).every(
            (field) => field.valid !== false,
          )

          setIsValid(isValid)

          if (!isValid) {
            return {
              type: 'validation',
              errors: getFieldErrors({ fields: revalidatedFormState }),
              fields: revalidatedFormState,
              replaceState: true,
            }
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

        if (!requestContext.isCurrent()) {
          return { type: 'superseded' }
        }

        const { data, fields, isValid } = validation

        submittedFields = deepCopyObjectSimpleWithoutReactComponents(fields)

        if (hasFormSubmitAction) {
          prevFormStateRef.current = fields
        }

        if (!isValid) {
          return {
            type: 'validation',
            errors: getFieldErrors({ fields }),
            fields: submittedFields,
            message: t('error:correctInvalidFields'),
          }
        }

        let overrides = {}

        if (typeof overridesFromArgs === 'function') {
          overrides = overridesFromArgs(fields)
        } else if (typeof overridesFromArgs === 'object') {
          overrides = overridesFromArgs
        }

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
            formState: applyOverridesToFormState({
              formState: deepCopyObjectSimpleWithoutReactComponents(submittedFields, {
                excludeFiles: true,
              }),
              overrides,
            }),
          })

          if (!requestContext.isCurrent()) {
            return { type: 'superseded' }
          }

          if ('unavailableMessage' in serverValidation) {
            return {
              type: 'validation',
              errors: [],
              fields: submittedFields,
              message: serverValidation.unavailableMessage,
            }
          }

          if (serverValidation.errors.length) {
            return {
              type: 'validation',
              errors: serverValidation.errors,
              fields: submittedFields,
              message: t('error:correctInvalidFields'),
            }
          }
        }

        if (onSubmit) {
          for (const [key, value] of Object.entries(overrides)) {
            data[key] = value
          }

          onSubmit(fields, data)
        }

        if (!hasFormSubmitAction) {
          return { type: 'local' }
        }

        const formData = await contextRef.current.createFormData(overrides, {
          action: typeof actionArg === 'string' ? actionArg : undefined,
          data,
          mergeOverrideData: Boolean(typeof overridesFromArgs !== 'function'),
        })

        if (!requestContext.isCurrent()) {
          return { type: 'superseded' }
        }

        let res: Response

        if (typeof actionArg === 'string') {
          res = await requests[methodToUse.toLowerCase()](actionArg, {
            body: formData,
            headers: { 'Accept-Language': i18n.language },
          })
        } else if (typeof actionArg === 'function') {
          res = (await actionArg(formData)) as unknown as Response
        } else {
          return { type: 'local' }
        }

        onResponse({ res })

        return {
          type: 'response',
          json: typeof handleResponse === 'function' ? undefined : await readResponseJSON({ res }),
          res,
        }
      }

      const reconcileFormState = async (outcome: SubmissionOutcome) => {
        if (!requestContext.isCurrent() || (!hasFormSubmitAction && didRefreshFormState)) {
          return
        }

        const isSuccess = outcome.type === 'response' && outcome.res.status < 400

        try {
          const refreshedFields = await refreshFormState(
            isSuccess && typeof handleResponse !== 'function'
              ? {
                  type: 'afterSave',
                  acceptValues,
                  isCurrent: requestContext.isCurrent,
                  refreshPermissions: context?.getDocPermissions !== false,
                  savedDocument: outcome.json?.doc ?? outcome.json?.result,
                }
              : { type: 'refresh', isCurrent: requestContext.isCurrent },
          )

          if (refreshedFields) {
            onRefresh()
          }
        } catch (error) {
          if (isSuccess && shouldReport()) {
            toast.error(error instanceof Error ? error.message : t('error:unknown'))
          } else {
            console.error('Error refreshing form state', error) // eslint-disable-line no-console
          }
        }
      }

      const reportFailure = (error: unknown) => {
        if (shouldReport()) {
          setIsSubmitted(true)
          errorToast(error instanceof Error ? error.message : t('error:unknown'))
        }
      }

      try {
        if (!isExplicitSubmit) {
          setIsBackgroundProcessing(true)
        }

        let outcome: SubmissionOutcome

        try {
          outcome = await prepareSubmission()
        } catch (error) {
          outcome =
            error instanceof UploadContinuesInBackgroundError
              ? { type: 'background' }
              : { type: 'failure', error }
        }

        if (outcome.type === 'superseded') {
          return
        }

        if (outcome.type === 'background') {
          allowDetachedToast = true
          successToast(t('upload:savingInBackground'))
          return
        }

        if (outcome.type === 'failure') {
          reportFailure(outcome.error)
          await reconcileFormState(outcome)
          return
        }

        if (outcome.type === 'local') {
          if (shouldReport()) {
            setIsSubmitted(true)
          }
          await reconcileFormState(outcome)
          return
        }

        if (outcome.type === 'validation') {
          if (shouldReport()) {
            if (outcome.replaceState && requestContext.isCurrent()) {
              if (hasFormSubmitAction) {
                prevFormStateRef.current = outcome.fields
              }
              dispatchFields({ type: 'REPLACE_STATE', state: outcome.fields })
            }

            setIsSubmitted(true)
            if (outcome.errors.length) {
              setIsValid(false)
              recordFieldErrors(outcome)
            }
            if (outcome.message) {
              errorToast(outcome.message)
            }
          }
          await reconcileFormState(outcome)
          return
        }

        const { res } = outcome
        const isSuccess = res.status < 400
        const hasCreatedDocument = Boolean(
          isDocumentForm &&
          collectionSlug &&
          operation === 'create' &&
          (outcome.json?.doc ?? outcome.json?.result)?.id != null,
        )

        if (isSuccess && (requestContext.isCurrent() || hasCreatedDocument)) {
          setSuccessfulSubmitCount((count) => count + 1)
        }
        if (isSuccess && isActive()) {
          const retainedErrors = submissionErrorsRef.current

          if (requestContext.isCurrent()) {
            submissionErrorsRef.current = undefined
          } else if (retainedErrors?.isActive()) {
            const resolvedErrors = new Set(
              getMatchingFieldErrors({
                currentFields: submittedFields,
                errors: retainedErrors.errors,
                submittedFields: retainedErrors.fields,
              }),
            )

            retainedErrors.errors = retainedErrors.errors.filter(
              (error) => !resolvedErrors.has(error),
            )
            if (!retainedErrors.errors.length) {
              submissionErrorsRef.current = undefined
            }
          }
        }

        // Custom handlers can replace form state, so only delegate while their values are current.
        if (typeof handleResponse === 'function' && requestContext.isCurrent()) {
          await reconcileFormState(outcome)
          if (!isActive()) {
            return
          }
          if (requestContext.isCurrent()) {
            if (isSuccess) {
              setIsModified(false)
            }
            const formSequence = getFormSequence()
            const resetSequence = resetSequenceRef.current

            await handleResponse(
              res,
              (message) => {
                allowDetachedToast = didCloseSavedForm({ formSequence, resetSequence })
                successToast(message)
              },
              errorToast,
            )
            return
          }
        }

        if (!isActive()) {
          return
        }

        if (!outcome.json) {
          outcome.json = await readResponseJSON({ res })
        }
        const json = outcome.json

        if (isSuccess) {
          await reconcileFormState(outcome)

          const shouldHandleSuccess =
            requestContext.isCurrent() || hasCreatedDocument || (isDocumentForm && isExplicitSubmit)

          if (!isActive() || (!shouldHandleSuccess && !shouldReport())) {
            return
          }

          const successSequence = getFormSequence()
          const successResetSequence = resetSequenceRef.current

          if (shouldHandleSuccess && typeof onSuccess === 'function') {
            try {
              await onSuccess(json, {
                context,
                formState: deepCopyObjectSimpleWithoutReactComponents(submittedFields, {
                  excludeFiles: true,
                }),
                isCurrent: requestContext.isCurrent,
                isQueueReset: requestContext.isQueueReset,
              })
            } catch (error) {
              if (shouldReport()) {
                toast.error(error instanceof Error ? error.message : t('error:unknown'))
              }
            }
          }

          // Closing a saved drawer unmounts its form before the success notification settles.
          allowDetachedToast = didCloseSavedForm({
            formSequence: successSequence,
            resetSequence: successResetSequence,
          })

          if (!shouldReport() && !allowDetachedToast) {
            return isExplicitSubmit && isActive() ? { res } : undefined
          }

          if (requestContext.isCurrent()) {
            setIsModified(false)
            setIsSubmitted(false)
          }

          if (redirect && requestContext.isCurrent()) {
            void startRouteTransition(() => router.push(redirect))
          } else if (!disableToast) {
            successToast(json.message || t('general:submissionSuccessful'))
          }

          return {
            ...(requestContext.isCurrent() ? { formState: contextRef.current.fields } : {}),
            res,
          }
        }

        if (!shouldReport()) {
          return
        }

        setIsSubmitted(true)
        if (overridesFromArgs['_status'] === 'draft') {
          setIsModified(true)
          if (!validateDrafts) {
            setIsSubmitted(false)
          }
        }

        if (json.message) {
          errorToast(json.message)
        } else if (Array.isArray(json.errors)) {
          const { fieldErrors, nonFieldErrors } = parseErrorResponse({ body: json })

          setIsValid(false)
          recordFieldErrors({ errors: fieldErrors, fields: submittedFields })
          nonFieldErrors.forEach((error) => {
            const err = {
              ...error,
              message: typeof error.message === 'string' ? error.message : t('error:unknown'),
            }

            if (
              !onNonFieldError?.(
                err,
                () => void contextRef.current.submit({ overrides: overridesFromArgs }),
              )
            ) {
              errorToast(<FieldErrorsToast errorMessage={err.message || t('error:unknown')} />)
            }
          })
        } else {
          errorToast(errorMessages?.[res.status] || res.statusText || t('error:unknown'))
        }

        await reconcileFormState(outcome)
      } catch (error) {
        reportFailure(error)
      } finally {
        if (isActive()) {
          if (disableFormWhileProcessing) {
            setIsProcessing(false)
            setDisabledBySubmission(false)
          }
          if (!isExplicitSubmit) {
            setIsBackgroundProcessing(false)
            if (!requestContext.isCurrent()) {
              onStaleRequest?.()
            }
          }
        }
        if (!didSettleToast && promiseToastID !== undefined) {
          toast.dismiss(promiseToastID)
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
    async <T extends Response, C extends Record<string, unknown>>(
      options?: SubmitOptions<C>,
      event?: FormEvent<HTMLFormElement>,
    ) => {
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

      return result.status === 'completed'
        ? (result.value as { formState?: FormState; res: T } | undefined)
        : undefined
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

const getFieldErrors = ({ fields }: { fields: FormState }): ValidationFieldError[] =>
  Object.entries(fields).flatMap(([path, field]) =>
    field.valid === false ? [{ message: field.errorMessage ?? '', path }] : [],
  )

const readResponseJSON = async ({ res }: { res: Response }): Promise<Data> =>
  res.headers.get('content-type')?.includes('application/json') ? res.json() : {}
