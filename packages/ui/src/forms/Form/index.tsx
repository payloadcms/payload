'use client'
import type { FormState } from 'payload'

import { dequal } from 'dequal/lite' // lite: no need for Map and Set support
import { serialize } from 'object-to-formdata'
import {
  getDataByPath as getDataByPathFunc,
  getDataFromFormState,
  getSiblingDataFromFormState,
  uploadRequiresServerValidation,
} from 'payload/shared'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type {
  CreateFormData,
  Context as FormContextType,
  FormFieldsContext as FormFieldsContextType,
  FormProps,
  GetDataByPath,
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
import { useFormState } from './useFormState.js'
import { useFormSubmission } from './useFormSubmission.js'

const baseClass = 'form'

export const Form: React.FC<FormProps> = (props) => {
  const { collectionSlug, docConfig } = useDocumentInfo()

  const {
    action,
    children,
    className,
    disabled: disabledFromProps = false,
    // fields: fieldsFromProps = collection?.fields || global?.fields,
    el,
    initialState, // fully formed initial field state
    isDocumentForm,
    onChange,
    uuid,
  } = props

  const method = 'method' in props ? props?.method : undefined

  const currentLocale = useLocale()
  const locale = currentLocale?.code
  const { refreshCookie } = useAuth()
  const { queueTask, resetQueue } = useQueue()

  const { getUploadHandler } = useUploadHandlers()

  const [isMounted, setIsMounted] = useState(false)

  const formRef = useRef<HTMLFormElement>(null)
  const contextRef = useRef({} as FormContextType)
  const isFirstRenderRef = useRef(true)

  const {
    dispatchFields,
    formState,
    isInitializing,
    isModified,
    isValid,
    prevFormStateRef,
    queueFormStateRefresh,
    refreshFormState,
    resetFormState,
    setIsValid,
    setModified: setFormStateModified,
    validateForm,
  } = useFormState({
    contextRef,
    onApplied: (appliedFormState, isSubmitted) => notifyOnChange(appliedFormState, isSubmitted),
    onReset: () => {
      resetQueue()
      restoreRequestState()
    },
    props,
    queueTask,
  })

  const {
    backgroundProcessing,
    disabledBySubmission,
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
  } = useFormSubmission({
    contextRef,
    dispatchFields,
    formRef,
    prevFormStateRef,
    props,
    queueTask,
    refreshFormState,
    setIsValid,
    setModified: setFormStateModified,
    validateForm,
  })

  const disabled = disabledFromProps || disabledBySubmission

  const fieldsContextValue = useMemo<FormFieldsContextType>(
    () => [formState, dispatchFields],
    [formState, dispatchFields],
  )

  const getFields = useCallback(() => contextRef.current.fields, [])

  const getField = useCallback((path: string) => contextRef.current.fields[path], [])

  const getData = useCallback(() => getDataFromFormState(contextRef.current.fields, true), [])

  const getSiblingData = useCallback(
    (path: string) => getSiblingDataFromFormState(contextRef.current.fields, path),
    [],
  )

  const getDataByPath = useCallback<GetDataByPath>(
    (path: string) => getDataByPathFunc(contextRef.current.fields, path),
    [],
  )

  const createFormData = useCallback<CreateFormData>(
    async (overrides, { data: dataFromArgs, mergeOverrideData = true }) => {
      let data = dataFromArgs || getDataFromFormState(contextRef.current.fields, true)

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
      resetQueue()
      restoreRequestState()
      setModified(false)
      dispatchFields({ type: 'REPLACE_STATE', state })
    },
    [dispatchFields, resetQueue, restoreRequestState, setModified],
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
    return () => resetQueue()
  }, [resetQueue])

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
  contextRef.current.initializing = isInitializing
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
      resetQueue()
      restoreRequestState()
      dispatchFields({
        type: 'REPLACE_STATE',
        optimize: false,
        state: initialState,
      })
    }
  }, [initialState, dispatchFields, resetQueue, restoreRequestState])

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
      onChangeFn({ formState: changedFormState, submitted: isSubmitted })
    }
  })

  useDebouncedEffect(
    () => {
      if (
        (isFirstRenderRef.current || !dequal(formState, prevFormStateRef.current)) &&
        isModified
      ) {
        queueFormStateRefresh()
      }

      prevFormStateRef.current = formState
      isFirstRenderRef.current = false
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
      data-form-ready={!processing && isMounted && !isInitializing}
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
              <InitializingContext value={!isMounted || isInitializing}>
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
