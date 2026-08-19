import type { I18nClient } from '@payloadcms/translations'

import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'
import { toast } from 'sonner'

import { requests } from '../../../utilities/api.js'

type MoveDocumentsArgs = {
  apiRoute: string
  /** Destination hierarchy item, or null for root. */
  destination: { id: null | number | string; title: string }
  i18n: I18nClient
  /** Human-readable label for what moved, used in the success toast. */
  label: string
  locale?: string
  /** The hierarchy item's parent/folder field name on each moved document. */
  parentFieldName: string
  /** Documents to move, grouped by collection slug. */
  selections: Record<string, { ids: (number | string)[] }>
  t: (key: string, options?: Record<string, unknown>) => string
}

/**
 * Bulk-assigns `parentFieldName` on every selected document, one PATCH per collection.
 *
 * Surfaces per-collection failures as toasts and keeps going, so one rejected collection doesn't
 * strand the rest. Returns how many documents actually moved, leaving it to the caller to decide
 * whether to refresh the view or clear its selection - the same reason it does not take an
 * `onSuccess`: drop and the Move button want different follow-up.
 */
export const moveDocuments = async ({
  apiRoute,
  destination,
  i18n,
  label,
  locale,
  parentFieldName,
  selections,
  t,
}: MoveDocumentsArgs): Promise<{ hasErrors: boolean; totalMoved: number }> => {
  let totalMoved = 0
  let hasErrors = false

  try {
    for (const [collectionSlug, { ids }] of Object.entries(selections)) {
      if (ids.length === 0) {
        continue
      }

      const queryString = qs.stringify(
        {
          locale,
          where: { id: { in: ids } },
        },
        { addQueryPrefix: true },
      )

      const url = formatAdminURL({
        apiRoute,
        path: `/${collectionSlug}${queryString}`,
      })

      const response = await requests.patch(url, {
        body: JSON.stringify({ [parentFieldName]: destination.id }),
        headers: {
          'Accept-Language': i18n.language,
          'Content-Type': 'application/json',
          credentials: 'include',
        },
      })

      const json = await response.json()

      if (response.status >= 400) {
        hasErrors = true

        if (json?.errors?.length > 0) {
          toast.error(json.message || t('error:unknown'), {
            description: json.errors.map((error: { message: string }) => error.message).join('\n'),
          })
        } else {
          toast.error(json?.message || t('error:unknown'))
        }

        continue
      }

      const movedCount = json?.docs?.length || 0
      totalMoved += movedCount

      if (json?.errors?.length > 0) {
        hasErrors = true
        toast.error(json.message, {
          description: json.errors.map((error: { message: string }) => error.message).join('\n'),
        })
      }
    }

    if (totalMoved > 0) {
      const successKey =
        destination.id === null ? 'hierarchy:itemsMovedToRoot' : 'hierarchy:itemsMovedTo'

      toast.success(
        t(successKey, {
          count: totalMoved,
          destination: destination.title,
          label,
        }),
      )
    }
  } catch (_err) {
    hasErrors = true
    toast.error(t('error:unknown'))
  }

  return { hasErrors, totalMoved }
}
