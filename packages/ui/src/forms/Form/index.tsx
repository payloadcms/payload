'use client'
import type { FormState, PayloadRequest } from 'payload'

import { dequal } from 'dequal/lite' // lite: no need for Map and Set support
import { serialize } from 'object-to-formdata'
import {
  deepCopyObjectSimpleWithoutReactComponents,
  getDataByPath as getDataByPathFunc,
  getSiblingData as getSiblingDataFunc,
  reduceFieldsToValues,
  uploadRequiresServerValidation,
} from 'payload/shared'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type {
  CreateFormData,
  FieldAction,
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
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useOperation } from '../../providers/Operation/index.js'
import { useServerFunctions } from '../../providers/ServerFunctions/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { useUploadHandlers } from '../../providers/UploadHandlers/index.js'
import { abortAndIgnore, handleAbortRef } from '../../utilities/abortAndIgnore.js'
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
import { fieldReducer } from './fieldReducer.js'
import { initContextState } from './initContextState.js'
import { requestPriority } from './requestPriority.js'
import { useFormSubmission } from './useFormSubmission.js'

const baseClass = 'form'

export const Form: React.FC<FormProps> = (props) => {
  const { id, collectionSlug, docConfig, docPermissions, getDocPreferences, globalSlug } =
    useDocumentInfo()

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

  const documentForm = useDocumentForm()

  const currentLocale = useLocale()
  const locale = currentLocale?.code
  const { t } = useTranslation()
  const { refreshCookie, user } = useAuth()
  const operation = useOperation()

  const { getFormState } = useServerFunctions()
  const { getUploadHandler } = useUploadHandlers()

  const { config } = useConfig()
  const [isMounted, setIsMounted] = useState(false)
  const isMountedRef = useRef(false)

  /**
   * Tracks wether the form state passes validation.
   * For example the state could be submitted but invalid as field errors have been returned.
   */
  const [isValid, setIsValid] = useState(true)
  const [initializing, setInitializing] = useState(initializingFromProps)

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
      if (changesFormData({ action, currentState: contextRef.current.fields })) {
        formSequenceRef.current += 1
      }

      dispatchFieldsWithoutIncrementingFormSequence(action)
    },
    [dispatchFieldsWithoutIncrementingFormSequence],
  )

  const fieldsContextValue = useMemo<FormFieldsContextType>(
    () => [formState, dispatchFields],
    [formState, dispatchFields],
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

  const {
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
  } = useFormSubmission({
    contextRef,
    dispatchFieldsWithoutIncrementingFormSequence,
    formRef,
    formSequenceRef,
    isMountedRef,
    prevFormStateRef: prevFormState,
    props,
    resetSequenceRef,
    setIsValid,
    setModifiedWithoutTracking: _setModified,
    validateForm,
  })

  const executeOnChange = useEffectEvent(() => {
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
          React.startTransition(() => {
            dispatchFieldsWithoutIncrementingFormSequence({
              type: 'MERGE_SERVER_STATE',
              prevStateRef: prevFormState,
              serverState,
            })

            // Refreshes cannot reproduce every submit-time validation, including uniqueness checks.
            if (submissionErrorsRef.current?.isCurrent()) {
              dispatchFieldsWithoutIncrementingFormSequence({
                type: 'ADD_SERVER_ERRORS',
                errors: Object.entries(submissionErrorsRef.current.fields).flatMap(
                  ([path, field]) =>
                    field.valid === false
                      ? [{ message: field.errorMessage || t('error:correctInvalidFields'), path }]
                      : [],
                ),
              })
            }
          })
        }
      },
    }).catch((err) => {
      console.error('Error in queued function:', err) // eslint-disable-line no-console
    })
  })

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
        priority: requestPriority[options?.submissionType ?? 'submit'],
        run: (requestContext) =>
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

      // A failed submit may have displaced a refresh without returning replacement form state.
      if (
        result.status === 'completed' &&
        !didReceiveSuccessfulResponse &&
        isMountedRef.current &&
        resetSequence === resetSequenceRef.current &&
        onChangeSequenceRef.current !== formSequenceRef.current
      ) {
        executeOnChange()
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
      contextRef.current = { ...initContextState }
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
      contextRef.current = { ...initContextState }
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
    if (initialState) {
      resetSequenceRef.current += 1
      resetRequestQueue()
      formSequenceRef.current = 0
      onChangeSequenceRef.current = 0
      restoreRequestState()
      contextRef.current = { ...initContextState }
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

  useDebouncedEffect(
    () => {
      if (onChangeSequenceRef.current !== formSequenceRef.current && modified) {
        executeOnChange()
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
  useDocumentForm,
  useForm,
  useFormFields,
  useFormModified,
  useFormProcessing,
  useFormSubmitted,
  useWatchForm,
} from './context.js'

export { FormProps }
