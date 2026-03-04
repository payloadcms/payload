import type { CollectionConfig } from '../../../collections/config/types.js'
import type { SanitizedConfig } from '../../types.js'

import { createJSONResponse } from './createJSONResponse.js'

/**
 * Validates and normalizes reorder endpoint input for a single request.
 */
export function validateReorderRequest(args: { body: unknown; config: SanitizedConfig }):
  | {
      collection: CollectionConfig
      collectionSlug: string
      docsToMove: string[]
      newKeyWillBe: 'greater' | 'less'
      orderableFieldName: string
      target: {
        id: string
        key: null | string | undefined
      }
    }
  | { errorResponse: Response } {
  const { body, config } = args

  if (!body || typeof body !== 'object') {
    return { errorResponse: createJSONResponse({ error: 'Request body must be an object' }, 400) }
  }

  const candidate = body as {
    collectionSlug?: unknown
    docsToMove?: unknown
    newKeyWillBe?: unknown
    orderableFieldName?: unknown
    target?: unknown
  }

  const { collectionSlug, docsToMove, newKeyWillBe, orderableFieldName, target } = candidate

  if (typeof collectionSlug !== 'string') {
    return { errorResponse: createJSONResponse({ error: 'collectionSlug must be a string' }, 400) }
  }

  if (!Array.isArray(docsToMove) || docsToMove.length === 0) {
    return {
      errorResponse: createJSONResponse({ error: 'docsToMove must be a non-empty array' }, 400),
    }
  }

  if (!docsToMove.every((id) => typeof id === 'string')) {
    return {
      errorResponse: createJSONResponse({ error: 'docsToMove must contain only string ids' }, 400),
    }
  }

  if (newKeyWillBe !== 'greater' && newKeyWillBe !== 'less') {
    return {
      errorResponse: createJSONResponse({ error: 'newKeyWillBe must be "greater" or "less"' }, 400),
    }
  }

  const collection = config.collections.find((c) => c.slug === collectionSlug)
  if (!collection) {
    return {
      errorResponse: createJSONResponse({ error: `Collection ${collectionSlug} not found` }, 400),
    }
  }

  if (typeof orderableFieldName !== 'string') {
    return {
      errorResponse: createJSONResponse({ error: 'orderableFieldName must be a string' }, 400),
    }
  }

  if (
    !target ||
    typeof target !== 'object' ||
    !('id' in target) ||
    typeof target.id === 'undefined' ||
    (typeof target.key !== 'string' && target.key !== null && typeof target.key !== 'undefined')
  ) {
    return {
      errorResponse: createJSONResponse({ error: 'target must be an object with id and key' }, 400),
    }
  }

  return {
    collection,
    collectionSlug,
    docsToMove,
    newKeyWillBe,
    orderableFieldName,
    target: {
      id: String(target.id),
      key: target.key as null | string | undefined,
    },
  }
}
