'use client'
import type { FormState } from 'payload'

import { serialize } from 'object-to-formdata'
import {
  getDataByPath as getDataByPathFunc,
  getSiblingData as getSiblingDataFunc,
  reduceFieldsToValues,
  uploadRequiresServerValidation,
} from 'payload/shared'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type {
  CreateFormData,
  Context as FormContextType,
  FormFieldsContext as FormFieldsContextType,
  FormProps,
  GetDataByPath,
  Submit,
} from './types.js'

import { useDebouncedEffect } from '../../hooks/useDebouncedEffect.js'
import { useEffectEvent } from '../../hooks/useEffectEvent.js'
import { useQueue } from '../../hooks/useQueue.js'
import { useThrottledEffect } from '../../hooks/useThrottledEffect.js'
import { useAuth } from '../../providers/Auth/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useUploadHandlers } from '../../providers/UploadHandlers/index.js'
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
} from './context.js'
import { initContextState } from './initContextState.js'
import { requestPriority } from './requestPriority.js'
import { useFormState } from './useFormState.js'
import { useFormSubmission } from './useFormSubmission.js'

const baseClass = 'form'

export const Form: React.FC<FormProps> = (props) => {
  const { collectionSlug, docConfig } = useDocumentInfo()

  const {
    action,
    children,
    className,
    // fields: fieldsFromProps = collection?.fields || global?.fields,
    el,
    initialState, // fully formed initial field state
    isDocumentForm,
    isInitializing: initializingFromProps,
    onChange,
    uuid,
  } = props

  const method = 'method' in props ? props?.method : undefined

  const currentLocale = useLocale()
  const locale = currentLocale?.code
  const { refreshCookie } = useAuth()
  const formSequenceRef = useRef(0)
  const resetSequenceRef = useRef(0)
  const isMountedRef = useRef(false)
  const latestExplicitSubmitRef = useRef<Promise<boolean> | undefined>(undefined)
  const requestQueueOptions = useMemo(() => ({ getSequence: () => formSequenceRef.current }), [])
  const { queueTask: scheduleRequest, resetQueue } = useQueue(requestQueueOptions)

  const { getUploadHandler } = useUploadHandlers()

  const [isMounted, setIsMounted] = useState(false)

  const [initializing, setInitializing] = useState(initializingFromProps)

  const formRef = useRef<HTMLFormElement>(null)
  const contextRef = useRef({} as FormContextType)

  const {
    dispatchFields,
    dispatchFieldsWithoutIncrementingFormSequence,
    formState,
    isInitializing: isFormStateInitializing,
    isModified,
    isValid,
    prevFormStateRef,
    refreshFormState,
    refreshFormStateAfterSave,
    resetFormState,
    setIsValid,
    setModified,
    setModifiedWithoutTracking,
    submissionErrorsRef,
    validateForm,
  } = useFormState({
    contextRef,
    formSequenceRef,
    onApplied: (appliedFormState, isSubmitted) => notifyOnChange(appliedFormState, isSubmitted),
    onReset: () => {
      resetSequenceRef.current += 1
      resetQueue()
      restoreRequestState()
    },
    props,
    queueTask: scheduleRequest,
    resetSequenceRef,
  })

  const {
    backgroundProcessing,
    disabled,
    disabledRef,
    disableFormForSubmission,
    executeSubmit,
    processing,
    releaseFormAfterSubmission,
    restoreRequestState,
    setBackgroundProcessing,
    setDisabled,
    setProcessing,
    setSubmitted,
    submitted,
    successfulSubmitCount,
  } = useFormSubmission({
    contextRef,
    dispatchFieldsWithoutIncrementingFormSequence,
    formRef,
    formSequenceRef,
    isMountedRef,
    prevFormStateRef,
    props,
    refreshFormStateAfterSave,
    resetSequenceRef,
    setIsValid,
    setModifiedWithoutTracking,
    submissionErrorsRef,
    validateForm,
  })

  const fieldsContextValue = useMemo<FormFieldsContextType>(
    () => [formState, dispatchFields],
    [formState, dispatchFields],
  )

  const submit = useCallback<Submit>(
    async (options, event) => {
      event?.stopPropagation()
      event?.preventDefault()
      if (disabledRef.current) {
        return
      }

      const shouldDisableForm = options?.disableFormWhileProcessing ?? true

      // Disable before queueing, like a direct submit, so the guard above rejects any submission made while this one waits.
      if (shouldDisableForm) {
        disableFormForSubmission()
      }

      const resetSequence = resetSequenceRef.current
      let didReceiveSuccessfulResponse = false
      const scheduledRequest = scheduleRequest({
        priority: requestPriority[options?.submissionType ?? 'submit'],
        task: (requestContext) =>
          executeSubmit({
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
        releaseFormAfterSubmission()
      }

      // A failed submit may have displaced a refresh without returning replacement form state.
      if (
        result.status === 'completed' &&
        !didReceiveSuccessfulResponse &&
        isMountedRef.current &&
        resetSequence === resetSequenceRef.current
      ) {
        refreshFormState({ force: true })
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
      disabledRef,
      disableFormForSubmission,
      executeSubmit,
      releaseFormAfterSubmission,
      scheduleRequest,
      refreshFormState,
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

  const replaceState = useCallback(
    (state: FormState) => {
      contextRef.current = {
        ...initContextState,
        disabled: contextRef.current.disabled,
        submitted: contextRef.current.submitted,
      }
      resetSequenceRef.current += 1
      resetQueue()
      restoreRequestState()
      setModifiedWithoutTracking(false)
      dispatchFieldsWithoutIncrementingFormSequence({ type: 'REPLACE_STATE', state })
    },
    [
      dispatchFieldsWithoutIncrementingFormSequence,
      resetQueue,
      restoreRequestState,
      setModifiedWithoutTracking,
    ],
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
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      resetSequenceRef.current += 1
      resetQueue()
    }
  }, [resetQueue])

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
  contextRef.current.createFormData = createFormData
  contextRef.current.setModified = setModified
  contextRef.current.setProcessing = setProcessing
  contextRef.current.setBackgroundProcessing = setBackgroundProcessing

  contextRef.current.submitted = submitted
  contextRef.current.setSubmitted = setSubmitted
  contextRef.current.setIsValid = setIsValid
  contextRef.current.disabled = disabled
  contextRef.current.setDisabled = setDisabled
  contextRef.current.formRef = formRef
  contextRef.current.reset = resetFormState
  contextRef.current.replaceState = replaceState
  contextRef.current.dispatchFields = dispatchFields
  contextRef.current.addFieldRow = addFieldRow
  contextRef.current.removeFieldRow = removeFieldRow
  contextRef.current.moveFieldRow = moveFieldRow
  contextRef.current.replaceFieldRow = replaceFieldRow
  contextRef.current.uuid = uuid
  contextRef.current.initializing = initializing || isFormStateInitializing
  contextRef.current.isValid = isValid

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (initialState) {
      // Restore after replacing the context, so the submit guard sees the restored disabled state immediately.
      contextRef.current = {
        ...initContextState,
        disabled: contextRef.current.disabled,
        submitted: contextRef.current.submitted,
      }
      resetSequenceRef.current += 1
      resetQueue()
      restoreRequestState()
      setModifiedWithoutTracking(false)
      dispatchFieldsWithoutIncrementingFormSequence({
        type: 'REPLACE_STATE',
        optimize: false,
        state: initialState,
      })
    }
  }, [
    initialState,
    dispatchFieldsWithoutIncrementingFormSequence,
    resetQueue,
    restoreRequestState,
    setModifiedWithoutTracking,
  ])

  useEffect(() => {
    resetSequenceRef.current += 1
    resetQueue()
    restoreRequestState()
  }, [resetQueue, restoreRequestState, uuid])

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

  const notifyOnChange = useEffectEvent((changedFormState: FormState, isSubmitted = submitted) => {
    if (!Array.isArray(onChange)) {
      return
    }

    for (const onChangeFn of onChange) {
      Promise.resolve(onChangeFn({ formState: changedFormState, submitted: isSubmitted })).catch(
        (err) => {
          console.error('Error in onChange:', err) // eslint-disable-line no-console
        },
      )
    }
  })

  useDebouncedEffect(
    () => {
      if (isModified) {
        refreshFormState()
      }

      prevFormStateRef.current = formState
    },
    [isModified, submitted, formState],
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
      data-form-ready={!processing && isMounted && !initializing && !isFormStateInitializing}
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
              <InitializingContext
                value={!isMounted || (isMounted && (initializing || isFormStateInitializing))}
              >
                <ProcessingContext value={processing}>
                  <BackgroundProcessingContext value={backgroundProcessing}>
                    <ModifiedContext value={isModified}>
                      {/* eslint-disable-next-line @eslint-react/no-context-provider */}
                      <FormFieldsContext.Provider value={fieldsContextValue}>
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
  useForm,
  useFormFields,
  useFormModified,
  useFormProcessing,
  useFormSubmitted,
  useWatchForm,
} from './context.js'

export { FormProps }
