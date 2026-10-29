'use client'
import { dequal } from 'dequal/lite' // lite: no need for Map and Set support
import { serialize } from 'object-to-formdata'
import { type FormState, type PayloadRequest } from 'payload'
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
  const { reset: resetQueue, schedule: scheduleRequest } = useQueue()
  const requestScopeRef = useRef({})
  const resetRequestQueue = useCallback(() => {
    requestScopeRef.current = {}
    resetQueue()
  }, [resetQueue])

  const { getFormState } = useServerFunctions()
  const { getUploadHandler } = useUploadHandlers()

  const { config } = useConfig()
  const [isMounted, setIsMounted] = useState(false)

  /**
   * Tracks wether the form state passes validation.
   * For example the state could be submitted but invalid as field errors have been returned.
   */
  const [isValid, setIsValid] = useState(true)
  const [initializing, setInitializing] = useState(initializingFromProps)

  const formRef = useRef<HTMLFormElement>(null)
  const contextRef = useRef({} as FormContextType)
  const abortResetFormRef = useRef<AbortController>(null)
  const isFirstRenderRef = useRef(true)

  const [formState, setFormState] = useState<FormState>(() => initialState || {})
  const formStateRef = useRef(formState)

  const dispatchFields = useCallback<React.Dispatch<FieldAction>>((action) => {
    const newState = fieldReducer(formStateRef.current, action)

    // A queued task can start before React commits the preceding task's state update.
    formStateRef.current = newState
    contextRef.current.fields = newState
    setFormState(newState)
  }, [])

  const fieldsContextValue = useMemo<FormFieldsContextType>(
    () => [formState, dispatchFields],
    [formState, dispatchFields],
  )

  contextRef.current.fields = formStateRef.current

  const prevFormState = useRef(formState)

  const validateForm = useCallback(async () => {
    const validatedFieldState = {}
    let isValid = true

    const data = contextRef.current.getData()

    const validationPromises = Object.entries(contextRef.current.fields).map(
      async ([path, field]) => {
        const validatedField = field
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

    if (!dequal(contextRef.current.fields, validatedFieldState)) {
      dispatchFields({ type: 'REPLACE_STATE', state: validatedFieldState })
    }

    setIsValid(isValid)

    return isValid
  }, [collectionSlug, config, dispatchFields, id, operation, t, user, documentForm])

  const {
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
  } = useFormSubmission({
    contextRef,
    dispatchFields,
    formRef,
    prevFormState,
    props,
    requestScopeRef,
    scheduleRequest,
    setIsValid,
  })

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
      resetRequestQueue()
      restoreRequestState()
      const controller = handleAbortRef(abortResetFormRef)

      const docPreferences = await getDocPreferences()

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

      contextRef.current = { ...initContextState }
      setModified(false)
      dispatchFields({ type: 'REPLACE_STATE', state: newState })

      abortResetFormRef.current = null
    },
    [
      collectionSlug,
      dispatchFields,
      globalSlug,
      id,
      operation,
      getFormState,
      docPermissions,
      getDocPreferences,
      locale,
      setModified,
      resetRequestQueue,
      restoreRequestState,
    ],
  )

  const replaceState = useCallback(
    (state: FormState) => {
      resetRequestQueue()
      restoreRequestState()
      contextRef.current = { ...initContextState }
      setModified(false)
      dispatchFields({ type: 'REPLACE_STATE', state })
    },
    [dispatchFields, setModified, resetRequestQueue, restoreRequestState],
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
      resetRequestQueue()
    }
  }, [resetRequestQueue])

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
      resetRequestQueue()
      restoreRequestState()
      contextRef.current = { ...initContextState }
      dispatchFields({
        type: 'REPLACE_STATE',
        optimize: false,
        state: initialState,
      })
    }
  }, [initialState, dispatchFields, resetRequestQueue, restoreRequestState])

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

  const executeOnChange = useEffectEvent(() => {
    void scheduleRequest({
      priority: requestPriority.formState,
      run: async (requestContext) => {
        if (Array.isArray(onChange)) {
          let serverState: FormState
          const requestFormState = deepCopyObjectSimpleWithoutReactComponents(
            contextRef.current.fields,
            {
              excludeFiles: true,
            },
          )

          for (const onChangeFn of onChange) {
            // Edit view default onChange is in packages/ui/src/views/Edit/index.tsx. This onChange usually sends a form state request
            serverState = await onChangeFn({
              formState: requestFormState,
              submitted,
            })
          }

          if (!requestContext.isCurrent()) {
            return
          }

          React.startTransition(() => {
            dispatchFields({
              type: 'MERGE_SERVER_STATE',
              prevStateRef: prevFormState,
              serverState,
            })
          })
        }
      },
    }).catch((err) => {
      console.error('Error in queued function:', err) // eslint-disable-line no-console
    })
  })

  useDebouncedEffect(
    () => {
      if ((isFirstRenderRef.current || !dequal(formState, prevFormState.current)) && modified) {
        executeOnChange()
      }

      prevFormState.current = formState
      isFirstRenderRef.current = false
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
