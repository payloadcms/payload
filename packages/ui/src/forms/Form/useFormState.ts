'use client'

import type { BuildFormStateArgs, Data, FormState, PayloadRequest, User } from 'payload'
import type { Dispatch, RefObject } from 'react'

import { dequal } from 'dequal/lite'
import {
  deepCopyObjectSimpleWithoutReactComponents,
  hasAutosaveEnabled,
  reduceFieldsToValues,
} from 'payload/shared'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { TaskContext, UseQueueResult } from '../../hooks/useQueue.js'
import type { BuildFormStateSuccessResult } from '../../utilities/buildFormState.js'
import type { AcceptValues } from './mergeServerFormState.js'
import type { FieldAction, Context as FormContextType, FormProps } from './types.js'

import { useAuth } from '../../providers/Auth/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useLivePreviewContext, usePreviewURL } from '../../providers/LivePreview/context.js'
import { useOperation } from '../../providers/Operation/index.js'
import { useServerFunctions } from '../../providers/ServerFunctions/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { abortAndIgnore } from '../../utilities/abortAndIgnore.js'
import { reduceFormStateToData } from '../../utilities/reduceFormStateToData.js'
import { useDocumentForm } from './context.js'
import { mergeServerFormState } from './mergeServerFormState.js'
import { requestPriority } from './requestPriority.js'

type FormStateRequestArgs = Omit<BuildFormStateArgs, 'req'>

type AfterSaveArgs = {
  /** How saved values merge with edits made during a background save. */
  acceptValues?: AcceptValues
  isCurrent?: TaskContext['isCurrent']
  /** Refresh document permissions before rebuilding saved state. */
  refreshPermissions?: boolean
  /** The document returned by a successful create or update, used as the source of saved field values. */
  savedDocument?: Data
}

type ValidateArgs = {
  isCurrent?: TaskContext['isCurrent']
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

export type FormStateActions = {
  /** True while rebuilding the selected schema. */
  isInitializing: boolean
  /**
   * Queues a server refresh for field edits and selected-field changes.
   * Local forms notify onApplied without requesting server state.
   * A failed background refresh retains the current fields and does not notify an applied result.
   */
  refreshFormState: () => void
  /**
   * Refreshes document permissions and rebuilds state from the saved document before success callbacks run.
   * Creates skip rebuilding because navigation or the containing drawer loads a new form.
   * Rejects on refresh failure; the submission owner still reports the completed write as successful.
   */
  refreshFormStateAfterSave: (args: AfterSaveArgs) => Promise<void>
  /**
   * Replaces fields with a fully rebuilt state for the supplied data and clears the modified flag.
   * Uses the nested, widget, or document schema, without edit notifications or lock/preview updates.
   */
  resetFormState: (data: unknown) => Promise<void>
  /**
   * For local submissions, requests server validation when a server schema is available.
   * Then runs client validation unless disabled and returns the already-applied fields, data, and validity.
   * Plain local forms use client validation only; failed or canceled server validation rejects rather than permitting a commit.
   */
  validateForm: (args?: ValidateArgs) => Promise<FormValidationResult>
}

type FormStateAction = { isCurrent?: TaskContext['isCurrent'] } & (
  | { data: unknown; type: 'reset' }
  | ({ type: 'afterSave' } & AfterSaveArgs)
  | { type: 'refresh' }
  | { type: 'validate' }
)

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
  dispatchFields: Dispatch<FieldAction>
  /** Called with the merged form state after a refresh or local validation applies it. */
  onApplied: (formState: FormState, submitted?: boolean) => void
  onReset: () => void
  prevFormStateRef: RefObject<FormState>
  props: Pick<
    FormProps,
    | 'disableValidationOnSubmit'
    | 'initialState'
    | 'isDocumentForm'
    | 'readOnly'
    | 'schemaPath'
    | 'select'
    | 'widgetSlug'
  >
  queueTask: UseQueueResult['queueTask']
  submittedRef: RefObject<boolean>
}

/**
 * Supplies the methods Form uses to keep its state up to date as fields change and submissions complete.
 * It calls the getFormState server function to build fresh server state, then applies that state to the form.
 * It also keeps document permissions, locks, stale-data warnings, and preview URLs in sync.
 *
 * @example
 * const { refreshFormState, refreshFormStateAfterSave, validateForm, resetFormState } = useFormState(args)
 *
 * refreshFormState() // Refresh after a field changes.
 * await refreshFormStateAfterSave({ savedDocument }) // Rebuild after a successful save.
 * const { data, fields, isValid } = await validateForm({ isLocalSubmission: true })
 * await resetFormState(data) // Rebuild from replacement data.
 */
export const useFormState = ({
  contextRef,
  dispatchFields,
  onApplied,
  onReset,
  prevFormStateRef,
  props,
  queueTask,
  submittedRef,
}: Args): FormStateActions => {
  const { user } = useAuth()
  const { config } = useConfig()
  const document = useDocumentInfo()
  const operation = useOperation()
  const livePreview = useLivePreviewContext()
  const preview = usePreviewURL()
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

  const initialData = useMemo(
    () => reduceFormStateToData({ formState: props.initialState }),
    [props.initialState],
  )

  const latest = {
    config,
    document,
    getFormState,
    initialData,
    livePreview,
    onApplied,
    onReset,
    operation,
    parentDocumentForm,
    preview,
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
      const isCurrent = action.isCurrent ?? (() => true)
      const current = latestRef.current
      const isRefresh = action.type === 'refresh'
      const isReset = action.type === 'reset'
      const isValidation = action.type === 'validate'
      const savedDocument = action.type === 'afterSave' ? action.savedDocument : undefined
      const submitted = isRefresh ? submittedRef.current : isValidation

      const acceptValues = isValidation
        ? true
        : action.type === 'afterSave'
          ? action.acceptValues
          : undefined

      const { document, props } = current

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
          ? reduceFormStateToData({ formState, initialData: current.initialData })
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
        const { livePreview, preview } = current

        if (savedDocument) {
          session.originalUpdatedAt = savedDocument.updatedAt
          session.hasCheckedForStaleData = false
          args.returnLivePreviewURL =
            livePreview.isLivePreviewEnabled && livePreview.typeofLivePreviewURL === 'function'
          args.returnPreviewURL = preview.isPreviewEnabled
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

        if (controller.signal.aborted || !isCurrent()) {
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
          !isCurrent() ||
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
          current.onReset()

          const fields = successResponse.state
          contextRef.current.fields = fields
          contextRef.current.setModified(false)
          prevFormStateRef.current = fields
          dispatchFields({ type: 'REPLACE_STATE', state: fields })
          return fields
        }

        if (isDocumentForm) {
          const { livePreview, preview } = current
          const { livePreviewURL, lockedState, previewURL, staleDataState, state } = successResponse

          if (savedDocument) {
            if (document.docConfig && 'upload' in document.docConfig && document.docConfig.upload) {
              delete state.file
            }

            if (
              livePreview.isLivePreviewEnabled &&
              livePreview.typeofLivePreviewURL === 'function'
            ) {
              livePreview.setURL(livePreviewURL)
            }

            if (preview.isPreviewEnabled) {
              preview.setPreviewURL(previewURL)
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

            if (staleDataState?.isStale) {
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
    [contextRef, dispatchFields, prevFormStateRef, submittedRef],
  )

  const queueFormStateRefresh = useCallback<FormStateActions['refreshFormState']>(() => {
    void queueTask({
      priority: requestPriority.formState,
      task: ({ isCurrent }) => refreshFormState({ type: 'refresh', isCurrent }),
    }).catch((err) => {
      console.error('Error refreshing form state', err) // eslint-disable-line no-console
    })
  }, [queueTask, refreshFormState])

  const validateFields = useCallback(
    async ({ isCurrent = () => true }: { isCurrent?: TaskContext['isCurrent'] } = {}) => {
      const { config, document, operation, parentDocumentForm, t, user } = latestRef.current
      const { id, collectionSlug } = document
      const validatedFieldState: FormState = {}
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

      if (!isCurrent()) {
        return false
      }

      if (!dequal(contextRef.current.fields, validatedFieldState)) {
        contextRef.current.fields = validatedFieldState
        dispatchFields({ type: 'REPLACE_STATE', state: validatedFieldState })
      }

      contextRef.current.setIsValid(isValid)

      return isValid
    },
    [contextRef, dispatchFields],
  )

  const validateForm = useCallback<FormStateActions['validateForm']>(
    async ({ isCurrent = () => true, isLocalSubmission = false, skipValidation = false } = {}) => {
      let isServerValidated = false
      let isValid = true

      if (!skipValidation && isLocalSubmission) {
        const fields = await refreshFormState({ type: 'validate', isCurrent })
        isServerValidated = fields !== undefined
        isValid = !fields || Object.values(fields).every((field) => field.valid !== false)
      }

      if (!skipValidation && isValid && !latestRef.current.props.disableValidationOnSubmit) {
        isValid = await validateFields({ isCurrent })
      }

      const fields = contextRef.current.fields ?? {}
      const data = isServerValidated
        ? reduceFormStateToData({ formState: fields })
        : reduceFieldsToValues(fields, true)

      if (isCurrent()) {
        contextRef.current.setIsValid(isValid)
      }

      return { data, fields, isValid }
    },
    [contextRef, refreshFormState, validateFields],
  )

  const resetFormState = useCallback<FormStateActions['resetFormState']>(
    async (data) => {
      await refreshFormState({ type: 'reset', data })
    },
    [refreshFormState],
  )

  const refreshFormStateAfterSave = useCallback<FormStateActions['refreshFormStateAfterSave']>(
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
      isInitializing,
      refreshFormState: queueFormStateRefresh,
      refreshFormStateAfterSave,
      resetFormState,
      validateForm,
    }),
    [
      refreshFormStateAfterSave,
      isInitializing,
      queueFormStateRefresh,
      resetFormState,
      validateForm,
    ],
  )
}
