'use client'

import type { BuildFormStateArgs, Data, FormState, PayloadRequest, User } from 'payload'
import type { Dispatch, RefObject } from 'react'

import { dequal } from 'dequal/lite'
import {
  deepCopyObjectSimpleWithoutReactComponents,
  getDataFromFormState,
  hasAutosaveEnabled,
} from 'payload/shared'
import React, { use, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'

import type { useQueue } from '../../hooks/useQueue.js'
import type { BuildFormStateSuccessResult } from '../../utilities/buildFormState.js'
import type { AcceptValues } from './mergeServerFormState.js'
import type { FieldAction, Context as FormContextType, FormProps } from './types.js'

import { useAuth } from '../../providers/Auth/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { LivePreviewContext } from '../../providers/LivePreview/context.js'
import { useOperation } from '../../providers/Operation/index.js'
import { useServerFunctions } from '../../providers/ServerFunctions/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { abortAndIgnore } from '../../utilities/abortAndIgnore.js'
import { useDocumentForm } from './context.js'
import { fieldReducer } from './fieldReducer.js'
import { mergeServerFormState } from './mergeServerFormState.js'

/** Counts submissions so a form-state response can tell whether one overlapped it. */
export type SubmissionActivity = {
  /** Submissions currently running. */
  running: number
  /** Submissions started since the form mounted. */
  started: number
}

type FormStateRequestArgs = Omit<BuildFormStateArgs, 'req'>

type AfterSaveArgs = {
  /** How saved values merge with edits made during a background save. */
  acceptValues?: AcceptValues
  /** Refresh document permissions before rebuilding saved state. */
  refreshPermissions?: boolean
  /** The document returned by a successful create or update, used as the source of saved field values. */
  savedDocument?: Data
}

type ValidateArgs = {
  /** Local commits need server validation before their onSubmit callback runs. */
  isLocalSubmission?: boolean
  skipValidation?: boolean
}

/** A completed validation result; callers can decide whether to submit without rebuilding or applying field state. */
type FormValidationResult = {
  /** Values derived from the validated fields, ready for the submission handler. */
  data: Data
  /** The fields already applied to the form, including errors and server-rendered components. */
  fields: FormState
  /** False when server or enabled client validation rejects a field. */
  isValid: boolean
}

export type UseFormStateResult = {
  /** Applies local field updates through the form reducer. */
  dispatchFields: Dispatch<FieldAction>
  /** Current fields, including their values, validation errors, and rendered components. */
  formState: FormState
  /** True while the caller initializes the form or the selected schema is being rebuilt. */
  isInitializing: boolean
  /** Whether the form has unsaved field changes. */
  isModified: boolean
  /** Whether the current fields pass validation. */
  isValid: boolean
  /** Baseline used to distinguish local edits from applied server state. */
  prevFormStateRef: RefObject<FormState>
  /** Queues a server refresh after field edits or changes to the selected fields. */
  refreshFormState: () => void
  /** Calls `refreshFormState` with the saved document to refresh permissions and preview URLs. */
  refreshFormStateAfterSave: (args: AfterSaveArgs) => Promise<void>
  /** Rebuilds field state from new data and clears the modified flag. */
  resetFormState: (data: unknown) => Promise<void>
  setIsValid: FormContextType['setIsValid']
  setModified: FormContextType['setModified']
  /** Checks the form before submission and returns its fields, data, and whether it's valid. */
  validateForm: (args?: ValidateArgs) => Promise<FormValidationResult>
}

type FormStateAction =
  | { data: unknown; type: 'reset' }
  | ({ type: 'afterSave' } & AfterSaveArgs)
  | { type: 'refresh' }
  | { type: 'validate' }

/** Mutable document bookkeeping shared by requests during this editing session. */
type DocumentSession = {
  /** Prevents repeated first-edit stale-data checks until the saved or refreshed document establishes a new baseline. */
  hasCheckedForStaleData: boolean
  /** Unix time in milliseconds of the last requested lock heartbeat; throttled to LAST_EDITED_INTERVAL_MS. */
  lastEditedAt: number
  /** Saved document's updatedAt timestamp, compared by the server with the current persisted value. */
  originalUpdatedAt?: string
}

const LAST_EDITED_INTERVAL_MS = 10_000

type Args = {
  contextRef: RefObject<FormContextType>
  /** Called with the merged form state after a refresh or local validation applies it. */
  onApplied: (formState: FormState, submitted?: boolean) => void
  props: Pick<
    FormProps,
    | 'disableValidationOnSubmit'
    | 'initialState'
    | 'isDocumentForm'
    | 'isInitializing'
    | 'readOnly'
    | 'schemaPath'
    | 'select'
    | 'widgetSlug'
  >
  queueTask: ReturnType<typeof useQueue>['queueTask']
  submissionActivityRef: RefObject<SubmissionActivity>
}

/**
 * Maintains form state and provides methods to update fields, validate, refresh, and reset the form.
 * Tracks whether the form is modified, valid, or initializing.
 * Calls `getFormState` when server state needs to be refreshed.
 *
 * @example
 * const { formState, dispatchFields, refreshFormState } = useFormState(args)
 *
 * dispatchFields({ type: 'UPDATE', path: 'title', value: 'Updated title' })
 * refreshFormState() // Refresh server state after a local edit.
 */
export const useFormState = ({
  contextRef,
  onApplied,
  props,
  queueTask,
  submissionActivityRef,
}: Args): UseFormStateResult => {
  const { isDocumentForm } = props

  const [formState, dispatchFields] = useReducer(fieldReducer, {}, () => props.initialState)

  contextRef.current.fields = formState

  const prevFormStateRef = useRef(formState)

  const [isValid, setIsValid] = useState(true)
  const [isModified, setModified] = useState(false)

  const { user } = useAuth()
  const { config } = useConfig()
  const document = useDocumentInfo()
  const operation = useOperation()
  const livePreview = isDocumentForm ? use(LivePreviewContext) : null
  const { t } = useTranslation()
  const { getFormState } = useServerFunctions()
  const parentDocumentForm = useDocumentForm()

  const documentSessionRef = useRef<DocumentSession>({
    hasCheckedForStaleData: false,
    lastEditedAt: 0,
    originalUpdatedAt: document.data?.updatedAt,
  })

  useEffect(() => {
    documentSessionRef.current.lastEditedAt = Date.now()
  }, [])

  const [isInitializing, setIsInitializing] = useState(false)

  const latest = {
    config,
    document,
    getFormState,
    livePreview,
    onApplied,
    operation,
    parentDocumentForm,
    props,
    t,
    user,
  }

  const latestRef = useRef(latest)

  latestRef.current = latest

  const abortControllerRef = useRef<AbortController>(null)
  const resetAbortControllerRef = useRef<AbortController>(null)

  useEffect(() => {
    return () => {
      abortAndIgnore(abortControllerRef.current)
      abortAndIgnore(resetAbortControllerRef.current)
    }
  }, [])

  const refreshFormState = useCallback(
    async (action: FormStateAction) => {
      const current = latestRef.current
      const isRefresh = action.type === 'refresh'
      const isReset = action.type === 'reset'
      const isValidation = action.type === 'validate'
      const savedDocument = action.type === 'afterSave' ? action.savedDocument : undefined
      const submitted = isRefresh ? Boolean(contextRef.current.submitted) : isValidation

      const acceptValues = isValidation
        ? true
        : action.type === 'afterSave'
          ? action.acceptValues
          : undefined

      const { document, livePreview, props } = current

      const {
        isDocumentForm,
        readOnly,
        schemaPath: schemaPathFromProps,
        select,
        widgetSlug,
      } = props

      const schemaPath =
        schemaPathFromProps ||
        widgetSlug ||
        ((isDocumentForm || isReset) && (document.collectionSlug || document.globalSlug))

      if (!schemaPath) {
        if (isReset) {
          throw new Error(current.t('error:unspecific'))
        }

        if (isRefresh) {
          current.onApplied(contextRef.current.fields, submitted)
        }

        return
      }

      const formState = isReset
        ? undefined
        : deepCopyObjectSimpleWithoutReactComponents(contextRef.current.fields ?? {}, {
            excludeFiles: true,
          })

      const isNested =
        !widgetSlug && schemaPath !== document.collectionSlug && schemaPath !== document.globalSlug

      const data = isReset
        ? (action.data as Data)
        : isNested
          ? getDataFromFormState(formState, true)
          : savedDocument

      const args: FormStateRequestArgs = {
        id: widgetSlug ? undefined : document.id,
        collectionSlug: widgetSlug ? undefined : document.collectionSlug,
        data,
        docPermissions: widgetSlug || isNested ? { fields: true } : document.docPermissions,
        docPreferences: widgetSlug
          ? { fields: {} }
          : !document.id && !document.globalSlug && select
            ? null
            : undefined,
        documentFormState: isNested ? current.parentDocumentForm?.getFields?.() : undefined,
        formState,
        globalSlug: widgetSlug ? undefined : document.globalSlug,
        initialBlockData: isNested ? data : undefined,
        operation: current.operation,
        readOnly,
        renderAllFields: isValidation || isReset,
        schemaPath,
        select,
        skipValidation: isReset || !(submitted || isNested || widgetSlug),
        widgetSlug,
      }

      if (isDocumentForm && !isReset) {
        const session = documentSessionRef.current

        if (savedDocument) {
          session.originalUpdatedAt = savedDocument.updatedAt
          session.hasCheckedForStaleData = false
          args.returnLivePreviewURL =
            livePreview?.isLivePreviewEnabled && livePreview.typeofLivePreviewURL === 'function'
          args.returnPreviewURL = livePreview?.isPreviewEnabled
        } else {
          // A router refresh can supply a newer baseline for stale-data detection.
          if (
            document.data?.updatedAt &&
            document.data.updatedAt > (session.originalUpdatedAt ?? '')
          ) {
            session.originalUpdatedAt = document.data.updatedAt
            session.hasCheckedForStaleData = false
          }

          const isLockingEnabled = document.docConfig?.lockDocuments !== false
          const now = Date.now()

          args.updateLastEdited =
            isLockingEnabled && now - session.lastEditedAt >= LAST_EDITED_INTERVAL_MS

          if (args.updateLastEdited) {
            session.lastEditedAt = now
          }

          // Autosave's own writes must not be reported as changes by another editor.
          args.checkForStaleData = Boolean(
            !session.hasCheckedForStaleData &&
            session.originalUpdatedAt &&
            current.operation === 'update' &&
            !document.isTrashed &&
            !hasAutosaveEnabled(document.docConfig),
          )

          if (args.checkForStaleData) {
            session.hasCheckedForStaleData = true
          }

          args.originalUpdatedAt = args.checkForStaleData ? session.originalUpdatedAt : undefined
          args.returnLockStatus = isLockingEnabled
        }
      }

      const activityAtStart = { ...submissionActivityRef.current }

      const controllerRef = isReset ? resetAbortControllerRef : abortControllerRef
      abortAndIgnore(controllerRef.current)
      const controller = new AbortController()
      controllerRef.current = controller

      try {
        if (
          savedDocument &&
          current.props.isDocumentForm &&
          action.type === 'afterSave' &&
          action.refreshPermissions !== false
        ) {
          args.docPermissions = await current.document.getDocPermissions(savedDocument)
        }

        // A successful create replaces the form and loads its own initial state.
        if (savedDocument && current.operation === 'create') {
          return
        }

        if (args.docPreferences === undefined) {
          args.docPreferences = await current.document.getDocPreferences?.()
        }

        if (controller.signal.aborted) {
          if (isValidation) {
            throw new Error(current.t('error:unspecific'))
          }

          return
        }

        const response = await current.getFormState({
          ...args,
          signal: controller.signal,
        })

        if (
          controller.signal.aborted ||
          !dequal(current.props.select, latestRef.current.props.select)
        ) {
          if (isValidation) {
            throw new Error(current.t('error:unspecific'))
          }

          return
        }

        if (!response?.state) {
          if (isRefresh) {
            return
          }

          throw new Error(current.t('error:unspecific'))
        }

        const successResponse = response as BuildFormStateSuccessResult

        if (isReset) {
          const fields = successResponse.state
          contextRef.current.fields = fields
          contextRef.current.setModified(false)
          prevFormStateRef.current = fields
          dispatchFields({ type: 'REPLACE_STATE', state: fields })
          return fields
        }

        const activity = submissionActivityRef.current

        if (isDocumentForm) {
          const { livePreviewURL, lockedState, previewURL, staleDataState, state } = successResponse

          if (savedDocument) {
            if (document.docConfig && 'upload' in document.docConfig && document.docConfig.upload) {
              delete state.file
            }

            if (
              livePreview?.isLivePreviewEnabled &&
              livePreview.typeofLivePreviewURL === 'function'
            ) {
              livePreview.setURL(livePreviewURL)
            }

            if (livePreview?.isPreviewEnabled) {
              livePreview.setPreviewURL(previewURL)
            }
          } else {
            if (document.docConfig?.lockDocuments !== false) {
              document.setDocumentIsLocked?.(true)

              if (lockedState?.user) {
                const lock = document.documentLockState.current
                const previousOwnerID = typeof lock?.user === 'object' ? lock?.user?.id : lock?.user

                const lockedUserID =
                  typeof lockedState.user === 'object' ? lockedState.user.id : lockedState.user

                if (!lock || lockedUserID !== previousOwnerID) {
                  document.documentLockState.current = {
                    hasShownLockedModal: lock?.hasShownLockedModal || false,
                    isLocked: true,
                    user: lockedState.user,
                  }

                  document.setCurrentEditor?.(lockedState.user as User)
                }

                if (lockedState.lastEditedAt) {
                  document.setLastUpdateTime(new Date(lockedState.lastEditedAt).getTime())
                }
              }
            }

            const overlappedSubmit =
              activityAtStart.running > 0 || activity.started !== activityAtStart.started

            if (staleDataState?.isStale && !overlappedSubmit) {
              document.setIsStale?.(true)
            }
          }
        }

        const currentState = contextRef.current.fields ?? {}

        // Validation uses the server's field set.
        // Keep client-only fields without lastRenderedPath, such as Lexical block names.
        const stateToMerge = isValidation
          ? Object.fromEntries([
              ...Object.entries(currentState).filter(
                ([path, field]) =>
                  !field.lastRenderedPath &&
                  !current.props.select &&
                  !Object.entries(successResponse.state).some(
                    ([parentPath, parent]) =>
                      parent.passesCondition === false && path.startsWith(`${parentPath}.`),
                  ),
              ),
              ...Object.keys(successResponse.state).map((path) => [path, currentState[path] ?? {}]),
            ])
          : currentState

        const appliedState = mergeServerFormState({
          acceptValues,
          currentState: stateToMerge,
          incomingState: successResponse.state,
        })

        if (isValidation) {
          contextRef.current.fields = appliedState
        }

        const merge = () => {
          if (isValidation) {
            prevFormStateRef.current = appliedState
            dispatchFields({ type: 'REPLACE_STATE', state: appliedState })
            return
          }

          dispatchFields({
            type: 'MERGE_SERVER_STATE',
            acceptValues,
            prevStateRef: prevFormStateRef,
            serverState: successResponse.state,
          })
        }

        if (isRefresh) {
          React.startTransition(merge)
        } else {
          merge()
        }

        if (isRefresh || isValidation) {
          current.onApplied(appliedState, submitted)
        }

        return appliedState
      } finally {
        if (controllerRef.current === controller) {
          controllerRef.current = null
          setIsInitializing(false)
        }
      }
    },
    [contextRef, dispatchFields, prevFormStateRef, submissionActivityRef],
  )

  const queueFormStateRefresh = useCallback<UseFormStateResult['refreshFormState']>(() => {
    queueTask(async () => {
      await refreshFormState({ type: 'refresh' })
    })
  }, [queueTask, refreshFormState])

  const validateFields = useCallback(async () => {
    const { config, document, operation, parentDocumentForm, t, user } = latestRef.current
    const { id, collectionSlug } = document
    const validatedFieldState: FormState = {}
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
              data: parentDocumentForm?.getData ? parentDocumentForm.getData() : data,
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
  }, [contextRef, dispatchFields])

  const validateForm = useCallback<UseFormStateResult['validateForm']>(
    async ({ isLocalSubmission = false, skipValidation = false } = {}) => {
      let isValid = true

      if (!skipValidation && isLocalSubmission) {
        const fields = await refreshFormState({ type: 'validate' })
        isValid = !fields || Object.values(fields).every((field) => field.valid !== false)
      }

      if (!skipValidation && isValid && !latestRef.current.props.disableValidationOnSubmit) {
        isValid = await validateFields()
      }

      const fields = contextRef.current.fields ?? {}
      const data = getDataFromFormState(fields, true)

      setIsValid(isValid)
      return { data, fields, isValid }
    },
    [contextRef, refreshFormState, validateFields],
  )

  const resetFormState = useCallback<UseFormStateResult['resetFormState']>(
    async (data) => {
      await refreshFormState({ type: 'reset', data })
    },
    [refreshFormState],
  )

  const refreshFormStateAfterSave = useCallback<UseFormStateResult['refreshFormStateAfterSave']>(
    async (args) => {
      await refreshFormState({ ...args, type: 'afterSave' })
    },
    [refreshFormState],
  )

  const previousSelectRef = useRef<FormProps['select']>(undefined)

  useEffect(() => {
    if (!dequal(previousSelectRef.current, props.select)) {
      previousSelectRef.current = props.select
      abortAndIgnore(abortControllerRef.current)
      abortControllerRef.current = null
      setIsInitializing(true)
      queueFormStateRefresh()
    }
  }, [props.select, queueFormStateRefresh])

  contextRef.current.validateForm = validateFields

  return useMemo(
    () => ({
      dispatchFields,
      formState,
      isInitializing: props.isInitializing || isInitializing,
      isModified,
      isValid,
      prevFormStateRef,
      refreshFormState: queueFormStateRefresh,
      refreshFormStateAfterSave,
      resetFormState,
      setIsValid,
      setModified,
      validateForm,
    }),
    [
      dispatchFields,
      formState,
      prevFormStateRef,
      refreshFormStateAfterSave,
      isInitializing,
      props.isInitializing,
      isValid,
      isModified,
      queueFormStateRefresh,
      resetFormState,
      setIsValid,
      setModified,
      validateForm,
    ],
  )
}
