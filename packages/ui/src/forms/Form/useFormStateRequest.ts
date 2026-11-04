'use client'

import type { Data, FormState } from 'payload'
import type { Dispatch, RefObject } from 'react'

import { deepCopyObjectSimpleWithoutReactComponents } from 'payload/shared'
import React, { useCallback, useEffect, useMemo, useRef } from 'react'

import type { useQueue } from '../../hooks/useQueue.js'
import type { BuildFormStateSuccessResult } from '../../utilities/buildFormState.js'
import type { AcceptValues } from './mergeServerFormState.js'
import type { FieldAction, Context as FormContextType, FormProps, FormStateArgs } from './types.js'

import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useOperation } from '../../providers/Operation/index.js'
import { useServerFunctions } from '../../providers/ServerFunctions/index.js'
import { abortAndIgnore } from '../../utilities/abortAndIgnore.js'
import { useDocumentFormState } from './useDocumentFormState.js'

/** Counts submissions so a form-state response can tell whether one overlapped it. */
export type SubmissionActivity = {
  /** Submissions currently running. */
  running: number
  /** Submissions started since the form mounted. */
  started: number
}

export type FormStateRequestOptions = {
  /** How the response merges with local changes. Set for the request after a successful submission. */
  acceptValues?: AcceptValues
  /** The saved document, for the request after a successful submission. */
  savedDocument?: Data
  /** Defaults to the form's submitted state when the request runs. */
  submitted?: boolean
}

export type FormStateRequests = {
  /**
   * Makes a request now and merges the response.
   * Used inside a submission, so the form stays disabled until the saved document's state is applied.
   */
  fetchFormState: (options: FormStateRequestOptions) => Promise<void>
  /** Queues a request after field changes. */
  requestFormState: () => void
}

type Args = {
  contextRef: RefObject<FormContextType>
  dispatchFields: Dispatch<FieldAction>
  /** Called after a queued request's state is applied. */
  onApplied: () => void
  prevFormStateRef: RefObject<FormState>
  props: Pick<FormProps, 'formStateArgs' | 'isDocumentForm'>
  queueTask: ReturnType<typeof useQueue>['queueTask']
  submissionActivityRef: RefObject<SubmissionActivity>
  submittedRef: RefObject<boolean>
}

/**
 * Owns the Form's `getFormState` requests.
 * Args are the defaults derived from the document, operation and form state, then document features (`isDocumentForm`), then `formStateArgs`.
 */
export const useFormStateRequest = ({
  contextRef,
  dispatchFields,
  onApplied,
  prevFormStateRef,
  props: { formStateArgs, isDocumentForm = false },
  queueTask,
  submissionActivityRef,
  submittedRef,
}: Args): FormStateRequests => {
  const { id, collectionSlug, docPermissions, getDocPreferences, globalSlug } = useDocumentInfo()
  const operation = useOperation()
  const { getFormState } = useServerFunctions()
  const documentFormState = useDocumentFormState({ isDocumentForm })

  const latest = {
    id,
    collectionSlug,
    docPermissions,
    documentFormState,
    formStateArgs,
    getDocPreferences,
    getFormState,
    globalSlug,
    isDocumentForm,
    onApplied,
    operation,
  }

  const latestRef = useRef(latest)

  latestRef.current = latest

  const abortControllerRef = useRef<AbortController>(null)

  useEffect(() => {
    return () => {
      abortAndIgnore(abortControllerRef.current)
    }
  }, [])

  const runRequest = useCallback(
    async (
      { acceptValues, savedDocument, submitted = submittedRef.current }: FormStateRequestOptions,
      { isQueued }: { isQueued: boolean },
    ) => {
      const current = latestRef.current

      if (!current.isDocumentForm && !current.formStateArgs) {
        return
      }

      const formState = deepCopyObjectSimpleWithoutReactComponents(contextRef.current.fields, {
        excludeFiles: true,
      })

      const consumerArgs =
        (typeof current.formStateArgs === 'function'
          ? current.formStateArgs({ formState })
          : current.formStateArgs) ?? {}

      const requestOperation = consumerArgs.operation ?? current.operation

      // A successful create replaces the form (redirect, drawer reload, next bulk upload file), which loads its own state.
      if (savedDocument && requestOperation === 'create') {
        return
      }

      const args: FormStateArgs = {
        id: current.id,
        collectionSlug: current.collectionSlug,
        data: savedDocument,
        docPermissions: current.docPermissions,
        globalSlug: current.globalSlug,
        operation: requestOperation,
        renderAllFields: false,
        schemaPath: current.collectionSlug || current.globalSlug,
        skipValidation: !submitted,
        ...current.documentFormState.getArgs({ operation: requestOperation, savedDocument }),
        ...consumerArgs,
      }

      const activityAtStart = { ...submissionActivityRef.current }

      abortAndIgnore(abortControllerRef.current)
      const controller = new AbortController()
      abortControllerRef.current = controller

      if (!('docPreferences' in args)) {
        args.docPreferences = await current.getDocPreferences()
      }

      const response = await current.getFormState({
        ...args,
        formState,
        signal: controller.signal,
      } as Parameters<typeof current.getFormState>[0])

      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null
      }

      if (!response?.state) {
        return
      }

      const successResponse = response as BuildFormStateSuccessResult
      const activity = submissionActivityRef.current

      current.documentFormState.onResponse(successResponse, {
        overlappedSubmit:
          activityAtStart.running > 0 || activity.started !== activityAtStart.started,
        savedDocument,
      })

      const merge = () =>
        dispatchFields({
          type: 'MERGE_SERVER_STATE',
          acceptValues,
          prevStateRef: prevFormStateRef,
          serverState: successResponse.state,
        })

      if (isQueued) {
        React.startTransition(merge)
        current.onApplied()
      } else {
        merge()
      }
    },
    [contextRef, dispatchFields, prevFormStateRef, submissionActivityRef, submittedRef],
  )

  const fetchFormState = useCallback<FormStateRequests['fetchFormState']>(
    (options) => runRequest(options, { isQueued: false }),
    [runRequest],
  )

  const requestFormState = useCallback<FormStateRequests['requestFormState']>(() => {
    queueTask(() => runRequest({}, { isQueued: true }))
  }, [queueTask, runRequest])

  return useMemo(() => ({ fetchFormState, requestFormState }), [fetchFormState, requestFormState])
}
