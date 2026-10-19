import type { DocumentCache } from './cache.js'
import type { DocumentReference } from './documents.js'
import type { ActivityDocumentsPage } from './getActivityWidgetDocs.js'

import { createDocumentCache, mergeDocumentPages } from './cache.js'
import { documentKey } from './documents.js'

export type DocumentState = {
  cache?: DocumentCache
  initialPage?: ActivityDocumentsPage
  /** Set after a pin change, so cached batches are bypassed until a reload succeeds. */
  isStale: boolean
  /** Offset of the page currently shown. It only moves once the target page has loaded. */
  offset: number
  /** Bumped to request a reload even when no batch is missing. */
  revision: number
  status: 'delayed' | 'error' | 'idle' | 'loading'
}

type Action =
  | { cache?: DocumentCache; type: 'restore' }
  | { document: DocumentReference; type: 'remove' }
  | { initialPage?: ActivityDocumentsPage; type: 'reset' }
  | { offset: number; pages: ActivityDocumentsPage[]; type: 'receive' }
  | { offset: number; type: 'show' }
  | { status: DocumentState['status']; type: 'status' }
  | { type: 'refresh' }
  | { type: 'retry' }

export function createDocumentState({
  initialPage,
}: {
  initialPage?: ActivityDocumentsPage
}): DocumentState {
  return {
    cache: createDocumentCache({ page: initialPage }),
    initialPage,
    isStale: false,
    offset: 0,
    revision: 0,
    status: 'idle',
  }
}

export function documentReducer(state: DocumentState, action: Action): DocumentState {
  switch (action.type) {
    case 'receive':
      return {
        ...state,
        cache: mergeDocumentPages({
          cache: state.cache,
          isReplacing: state.isStale,
          pages: action.pages,
        }),
        isStale: false,
        offset: action.offset,
        status: 'idle',
      }
    case 'refresh':
      return {
        ...state,
        isStale: true,
        revision: state.revision + 1,
        status: 'idle',
      }
    case 'remove': {
      if (!state.cache) {
        return state
      }

      const key = documentKey(action.document)

      return {
        ...state,
        cache: {
          batches: Object.fromEntries(
            Object.entries(state.cache.batches).map(([batch, items]) => [
              batch,
              items.filter((item) => documentKey(item) !== key),
            ]),
          ),
          totalDocs: Math.max(0, state.cache.totalDocs - 1),
        },
      }
    }
    case 'reset':
      return createDocumentState({ initialPage: action.initialPage })
    case 'restore':
      return { ...state, cache: action.cache }
    case 'retry':
      return { ...state, revision: state.revision + 1, status: 'idle' }
    case 'show':
      return state.offset === action.offset && state.status === 'idle'
        ? state
        : { ...state, offset: action.offset, status: 'idle' }
    case 'status':
      return { ...state, status: action.status }
  }
}
