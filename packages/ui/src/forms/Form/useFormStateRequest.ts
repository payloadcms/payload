'use client'

import type { Data, FormState } from 'payload'
import type { Dispatch, RefObject } from 'react'

import { deepCopyObjectSimpleWithoutReactComponents } from 'payload/shared'
import React, { useCallback, useEffect, useRef } from 'react'

import type { useQueue } from '../../hooks/useQueue.js'
import type { BuildFormStateSuccessResult } from '../../utilities/buildFormState.js'
import type { AcceptValues } from './mergeServerFormState.js'
import type {
  FieldAction,
  Context as FormContextType,
  FormProps,
  FormStateRequestArgs,
  FormStateRequestContext,
} from './types.js'

import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useOperation } from '../../providers/Operation/index.js'
import { useServerFunctions } from '../../providers/ServerFunctions/index.js'
import { abortAndIgnore } from '../../utilities/abortAndIgnore.js'

/** Counts submissions so a form-state response can tell whether one overlapped it. */
export type SubmissionActivity = {
  /** Submissions currently running. */
  running: number
  /** Submissions started since the form mounted. */
  started: number
}

export type RequestFormState = (args: {
  /** How the response merges with local changes. Set for the request after a successful submission. */
  acceptValues?: AcceptValues
  /** The saved document, for the request after a successful submission. */
  savedDocument?: Data
  submitted: boolean
}) => void

type Args = {
  contextRef: RefObject<FormContextType>
  dispatchFields: Dispatch<FieldAction>
  formStateRequest: FormProps['formStateRequest']
  prevFormStateRef: RefObject<FormState>
  queueTask: ReturnType<typeof useQueue>['queueTask']
  submissionActivityRef: RefObject<SubmissionActivity>
}

/**
 * Owns the form's `getFormState` requests.
 * Returns a stable `requestFormState` that queues a request built from the Form's defaults and the `formStateRequest` prop.
 */
export const useFormStateRequest = ({
  contextRef,
  dispatchFields,
  formStateRequest,
  prevFormStateRef,
  queueTask,
  submissionActivityRef,
}: Args): RequestFormState => {
  const { id, collectionSlug, docPermissions, getDocPreferences, globalSlug } = useDocumentInfo()
  const operation = useOperation()
  const { getFormState } = useServerFunctions()

  const latestRef = useRef({
    id,
    collectionSlug,
    docPermissions,
    formStateRequest,
    getDocPreferences,
    getFormState,
    globalSlug,
    operation,
  })

  latestRef.current = {
    id,
    collectionSlug,
    docPermissions,
    formStateRequest,
    getDocPreferences,
    getFormState,
    globalSlug,
    operation,
  }

  const abortControllerRef = useRef<AbortController>(null)

  useEffect(() => {
    return () => {
      abortAndIgnore(abortControllerRef.current)
    }
  }, [])

  return useCallback<RequestFormState>(
    ({ acceptValues, savedDocument, submitted }) => {
      queueTask(async () => {
        const latest = latestRef.current

        if (!latest.formStateRequest) {
          return
        }

        const { args, onResponse } = latest.formStateRequest
        const formState = deepCopyObjectSimpleWithoutReactComponents(contextRef.current.fields, {
          excludeFiles: true,
        })
        const requestContext: FormStateRequestContext = { formState, savedDocument, submitted }
        const requestArgs = typeof args === 'function' ? args(requestContext) : args

        const resolvedArgs: FormStateRequestArgs = {
          id: latest.id,
          collectionSlug: latest.collectionSlug,
          data: savedDocument,
          docPermissions: latest.docPermissions,
          globalSlug: latest.globalSlug,
          operation: latest.operation,
          renderAllFields: false,
          schemaPath: latest.collectionSlug || latest.globalSlug,
          skipValidation: !submitted,
          ...requestArgs,
        }

        // A successful create replaces the form (redirect, drawer reload, next bulk upload file), which loads its own state.
        if (savedDocument && resolvedArgs.operation === 'create') {
          return
        }

        const activityAtStart = { ...submissionActivityRef.current }

        abortAndIgnore(abortControllerRef.current)
        const controller = new AbortController()
        abortControllerRef.current = controller

        if (!('docPreferences' in resolvedArgs)) {
          resolvedArgs.docPreferences = await latest.getDocPreferences()
        }

        const response = await latest.getFormState({
          ...resolvedArgs,
          formState,
          signal: controller.signal,
        } as Parameters<typeof latest.getFormState>[0])

        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null
        }

        if (!response?.state) {
          return
        }

        const successResponse = response as BuildFormStateSuccessResult

        const activity = submissionActivityRef.current

        const serverState =
          onResponse?.(successResponse, {
            ...requestContext,
            overlappedSubmit:
              activityAtStart.running > 0 || activity.started !== activityAtStart.started,
          }) || successResponse.state

        React.startTransition(() => {
          dispatchFields({
            type: 'MERGE_SERVER_STATE',
            acceptValues,
            prevStateRef: prevFormStateRef,
            serverState,
          })
        })
      })
    },
    [contextRef, dispatchFields, prevFormStateRef, queueTask, submissionActivityRef],
  )
}
