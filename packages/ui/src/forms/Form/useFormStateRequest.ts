'use client'

import type { Data, FormState } from 'payload'
import type { Dispatch, RefObject } from 'react'

import { deepCopyObjectSimpleWithoutReactComponents } from 'payload/shared'
import React, { useCallback, useEffect, useMemo, useRef } from 'react'

import type { UseQueueResult } from '../../hooks/useQueue.js'
import type { BuildFormStateSuccessResult } from '../../utilities/buildFormState.js'
import type { AcceptValues } from './mergeServerFormState.js'
import type { FieldAction, Context as FormContextType, FormProps, FormStateArgs } from './types.js'

import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useOperation } from '../../providers/Operation/index.js'
import { useServerFunctions } from '../../providers/ServerFunctions/index.js'
import { abortAndIgnore } from '../../utilities/abortAndIgnore.js'
import { mergeServerFormState } from './mergeServerFormState.js'
import { requestPriority } from './requestPriority.js'
import { useDocumentFormState } from './useDocumentFormState.js'

export type FormStateRequestOptions = {
  /** How the response merges with local changes. Set for the request after a successful submission. */
  acceptValues?: AcceptValues
  /** Returns `false` once the request is stale, e.g. after a reset. Its response is then dropped. */
  isCurrent?: () => boolean
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
  /** Called with the merged form state after a queued request's response is applied. */
  onApplied: (formState: FormState) => void
  prevFormStateRef: RefObject<FormState>
  props: Pick<FormProps, 'formStateArgs' | 'isDocumentForm'>
  queueTask: UseQueueResult['queueTask']
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
      {
        acceptValues,
        isCurrent,
        savedDocument,
        submitted = submittedRef.current,
      }: FormStateRequestOptions,
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

      if (!response?.state || isCurrent?.() === false) {
        return
      }

      const successResponse = response as BuildFormStateSuccessResult
      current.documentFormState.onResponse(successResponse, { savedDocument })

      const merge = () =>
        dispatchFields({
          type: 'MERGE_SERVER_STATE',
          acceptValues,
          prevStateRef: prevFormStateRef,
          serverState: successResponse.state,
        })

      if (isQueued) {
        // Computed here because the transition render can stay pending, e.g. while server components load.
        const mergedState = mergeServerFormState({
          acceptValues,
          currentState: contextRef.current.fields,
          incomingState: successResponse.state,
        })

        React.startTransition(merge)
        current.onApplied(mergedState)
      } else {
        merge()
      }
    },
    [contextRef, dispatchFields, prevFormStateRef, submittedRef],
  )

  const fetchFormState = useCallback<FormStateRequests['fetchFormState']>(
    (options) => runRequest(options, { isQueued: false }),
    [runRequest],
  )

  const requestFormState = useCallback<FormStateRequests['requestFormState']>(() => {
    void queueTask({
      priority: requestPriority.formState,
      task: ({ isCurrent }) => runRequest({ isCurrent }, { isQueued: true }),
    }).catch((err) => {
      console.error('Error in form-state request:', err) // eslint-disable-line no-console
    })
  }, [queueTask, runRequest])

  return useMemo(() => ({ fetchFormState, requestFormState }), [fetchFormState, requestFormState])
}
