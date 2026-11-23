import { useEffect, useMemo, useReducer } from 'react'

import type { DocumentReference } from './documents.js'
import type { ActivityDocumentsPage, ActivityDocumentType } from './getActivityWidgetDocs.js'

import { useServerFunctions } from '../../../providers/ServerFunctions/index.js'
import { getDocumentPage } from './cache.js'
import { DOCUMENTS_BATCH_SIZE } from './constants.js'
import { createDocumentState, documentReducer } from './state.js'

const LOADING_FEEDBACK_DELAY_MS = 180

/**
 * Loads the batches the page at `offset` needs. The current page stays visible while the target
 * page loads, and loading feedback only appears after a short delay.
 */
export function useActivityDocuments({
  type,
  excludedCollections,
  hasPinPlaceholder = false,
  initialPage,
  isActive,
  isPaused = false,
  offset,
  pageSize,
}: {
  excludedCollections?: string[]
  hasPinPlaceholder?: boolean
  initialPage?: ActivityDocumentsPage
  isActive: boolean
  isPaused?: boolean
  offset: number
  pageSize: number
  type: ActivityDocumentType
}) {
  const { serverFunction } = useServerFunctions()
  const [state, dispatch] = useReducer(documentReducer, { initialPage }, createDocumentState)

  // A server refresh replaces the documents and supersedes requests for the previous data.
  if (state.initialPage !== initialPage) {
    dispatch({ type: 'reset', initialPage })
  }

  const { missingBatches, targetPage } = useMemo(() => {
    const targetPage = getDocumentPage({
      cache: state.cache,
      hasPinPlaceholder,
      offset,
      pageSize,
    })
    const missingBatches = state.isStale
      ? getDocumentPage({
          cache: state.cache && { ...state.cache, batches: {} },
          hasPinPlaceholder,
          offset,
          pageSize,
        }).missingBatches
      : targetPage.missingBatches

    // A stale placeholder-only page still needs the server's updated total.
    return {
      missingBatches:
        state.isStale && !missingBatches.length
          ? [Math.floor(targetPage.start / DOCUMENTS_BATCH_SIZE)]
          : missingBatches,
      targetPage,
    }
  }, [hasPinPlaceholder, offset, pageSize, state.cache, state.isStale])
  const isBusy = missingBatches.length > 0
  const page = isBusy
    ? getDocumentPage({
        cache: state.cache,
        hasPinPlaceholder,
        offset: state.offset,
        pageSize,
      })
    : targetPage

  useEffect(() => {
    if (!isActive || isPaused) {
      return
    }
    if (!missingBatches.length) {
      dispatch({ type: 'show', offset })
      return
    }

    let isCurrent = true
    dispatch({ type: 'status', status: 'loading' })
    const timeout = setTimeout(
      () => dispatch({ type: 'status', status: 'delayed' }),
      LOADING_FEEDBACK_DELAY_MS,
    )

    void Promise.all(
      missingBatches.map(
        (batch) =>
          serverFunction({
            name: 'get-activity-widget-docs',
            args: {
              type,
              excludedCollections,
              limit: DOCUMENTS_BATCH_SIZE,
              page: batch + 1,
            },
          }) as Promise<ActivityDocumentsPage>,
      ),
    )
      .then((pages) => {
        if (isCurrent) {
          dispatch({ type: 'receive', offset, pages })
        }
      })
      .catch(() => {
        if (isCurrent) {
          dispatch({ type: 'status', status: 'error' })
        }
      })
      .finally(() => clearTimeout(timeout))

    return () => {
      isCurrent = false
      clearTimeout(timeout)
    }
  }, [
    excludedCollections,
    initialPage,
    isActive,
    isPaused,
    missingBatches,
    offset,
    serverFunction,
    state.revision,
    type,
  ])

  return {
    ...page,
    hasLoadError: isBusy && state.status === 'error',
    isBusy,
    /** Reloads the tab from the server, bypassing cached batches until the reload succeeds. */
    refresh: () => dispatch({ type: 'refresh' }),
    /** Removes a document optimistically and returns a function that restores it. */
    removeDocument: ({ document }: { document: DocumentReference }) => {
      const cache = state.cache

      dispatch({ type: 'remove', document })
      return () => dispatch({ type: 'restore', cache })
    },
    retry: () => dispatch({ type: 'retry' }),
    shouldShowLoading: isBusy && state.status === 'delayed',
  }
}

export type DocumentsController = ReturnType<typeof useActivityDocuments>
