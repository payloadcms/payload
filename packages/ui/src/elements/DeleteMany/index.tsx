'use client'
import type { ClientCollectionConfig, Where } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import { useRouter, useSearchParams } from 'next/navigation.js'
import { mergeListSearchAndWhere } from 'payload/shared'
import * as qs from 'qs-esm'
import React from 'react'
import { toast } from 'sonner'

import { useAuth } from '../../providers/Auth/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useRouteCache } from '../../providers/RouteCache/index.js'
import { SelectAllStatus, useSelection } from '../../providers/Selection/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { requests } from '../../utilities/api.js'
import { parseSearchParams } from '../../utilities/parseSearchParams.js'
import { ConfirmationModal } from '../ConfirmationModal/index.js'
import { ListSelectionButton } from '../ListSelection/index.js'

const confirmManyDeleteDrawerSlug = `confirm-delete-many-docs`

export type Props = {
  collection: ClientCollectionConfig
  title?: string
}

export const DeleteMany: React.FC<Props> = (props) => {
  const { collection: { slug } = {} } = props

  const { permissions } = useAuth()
  const { count, getSelectedIds, selectAll, toggleAll } = useSelection()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { clearRouteCache } = useRouteCache()

  const collectionPermissions = permissions?.collections?.[slug]
  const hasDeletePermission = collectionPermissions?.delete

  if (selectAll === SelectAllStatus.None || !hasDeletePermission) {
    return null
  }

  const selectingAll = selectAll === SelectAllStatus.AllAvailable
  const selectedIDs = !selectingAll ? getSelectedIds() : []

  return (
    <React.Fragment>
      <DeleteMany_v4
        afterDelete={() => {
          toggleAll()

          router.replace(
            qs.stringify(
              {
                ...parseSearchParams(searchParams),
                page: selectAll ? '1' : undefined,
              },
              { addQueryPrefix: true },
            ),
          )

          clearRouteCache()
        }}
        search={parseSearchParams(searchParams)?.search as string}
        selections={{
          [slug]: {
            all: selectAll === SelectAllStatus.AllAvailable,
            ids: selectedIDs,
            totalCount: selectingAll ? count : selectedIDs.length,
          },
        }}
        where={parseSearchParams(searchParams)?.where as Where}
      />
    </React.Fragment>
  )
}

type AfterDeleteResult = {
  [relationTo: string]: {
    deletedCount: number
    errors: unknown[]
    ids: (number | string)[]
    totalCount: number
  }
}
type DeleteMany_v4Props = {
  /**
   * A callback function to be called after the delete request is completed.
   */
  afterDelete?: (result: AfterDeleteResult) => void
  /**
   * Optionally pass a search string to filter the documents to be deleted.
   *
   * This is intentionally passed as a prop so modals could pass in their own
   * search string that may not be stored in the URL.
   */
  search?: string
  /**
   * An object containing the relationTo as the key and an object with the following properties:
   * - all: boolean
   * - totalCount: number
   * - ids: (string | number)[]
   */
  selections: {
    [relationTo: string]: {
      all?: boolean
      ids?: (number | string)[]
      totalCount?: number
    }
  }
  /**
   * Optionally pass a where clause to filter the documents to be deleted.
   * This will be ignored if multiple relations are selected.
   *
   * This is intentionally passed as a prop so modals could pass in their own
   * where clause that may not be stored in the URL.
   */
  where?: Where
}

/**
 * Handles polymorphic document delete operations.
 *
 * If you are deleting monomorphic documents, shape your `selections` to match the polymorphic structure.
 */
export function DeleteMany_v4({ afterDelete, search, selections, where }: DeleteMany_v4Props) {
  const { t } = useTranslation()
  const {
    config: {
      collections,
      routes: { api },
      serverURL,
    },
  } = useConfig()
  const { code: locale } = useLocale()
  const { i18n } = useTranslation()
  const { openModal } = useModal()

  const handleDelete = React.useCallback(async () => {
    const deletingOneCollection = Object.keys(selections).length === 1
    const result: AfterDeleteResult = {}
    for (const [relationTo, { all, ids = [] }] of Object.entries(selections)) {
      const collectionConfig = collections.find(({ slug }) => slug === relationTo)
      if (collectionConfig) {
        let whereConstraint: Where

        if (all) {
          // selecting all documents with optional where filter
          if (deletingOneCollection && where) {
            whereConstraint = where
          } else {
            whereConstraint = {
              id: { not_equals: '' },
            }
          }
        } else {
          // selecting specific documents
          whereConstraint = {
            id: {
              in: ids,
            },
          }
        }

        const deleteManyResponse = await requests.delete(
          `${serverURL}${api}/${relationTo}${qs.stringify(
            {
              limit: 0,
              locale,
              where: mergeListSearchAndWhere({
                collectionConfig,
                search,
                where: whereConstraint,
              }),
            },
            { addQueryPrefix: true },
          )}`,
          {
            headers: {
              'Accept-Language': i18n.language,
              'Content-Type': 'application/json',
            },
          },
        )

        try {
          const { plural, singular } = collectionConfig.labels
          const json = await deleteManyResponse.json()

          const deletedDocs = json?.docs.length || 0
          const successLabel = deletedDocs > 1 ? plural : singular

          if (deleteManyResponse.status < 400 || deletedDocs > 0) {
            toast.success(
              t('general:deletedCountSuccessfully', {
                count: deletedDocs,
                label: getTranslation(successLabel, i18n),
              }),
            )
          }

          if (json?.errors.length > 0) {
            toast.error(json.message, {
              description: json.errors.map((error) => error.message).join('\n'),
            })
          }

          result[relationTo] = {
            deletedCount: deletedDocs,
            errors: json?.errors || null,
            ids: json?.docs.map((doc) => doc.id) || [],
            totalCount: json.totalDocs,
          }

          if (deleteManyResponse.status > 400 && json?.errors.length === 0) {
            toast.error(t('error:unknown'))
            result[relationTo].errors = [t('error:unknown')]
          }
          continue
        } catch (_err) {
          toast.error(t('error:unknown'))
          result[relationTo] = {
            deletedCount: 0,
            errors: [_err],
            ids: [],
            totalCount: 0,
          }
          continue
        }
      }
    }

    if (typeof afterDelete === 'function') {
      afterDelete(result)
    }
  }, [selections, afterDelete, collections, locale, search, serverURL, api, i18n, where, t])

  const { label: labelString, labelCount } = Object.entries(selections).reduce(
    (acc, [key, value], index, array) => {
      const collectionConfig = collections.find(({ slug }) => slug === key)
      if (collectionConfig) {
        const labelCount = acc.labelCount === undefined ? value.totalCount : acc.labelCount
        const collectionLabel = `${acc.labelCount !== undefined ? `${value.totalCount} ` : ''}${getTranslation(
          value.totalCount > 1 ? collectionConfig.labels.plural : collectionConfig.labels.singular,
          i18n,
        )}`
        let newLabel
        if (index === array.length - 1 && index !== 0) {
          newLabel = `${acc.label} and ${collectionLabel}`
        } else if (index > 0) {
          newLabel = `${acc.label}, ${collectionLabel}`
        } else {
          newLabel = collectionLabel
        }

        return {
          label: newLabel,
          labelCount,
        }
      }
      return acc
    },
    {
      label: '',
      labelCount: undefined,
    },
  )

  return (
    <React.Fragment>
      <ListSelectionButton
        aria-label={t('general:delete')}
        className="delete-documents__toggle"
        onClick={() => {
          openModal(confirmManyDeleteDrawerSlug)
        }}
      >
        {t('general:delete')}
      </ListSelectionButton>
      <ConfirmationModal
        body={t('general:aboutToDeleteCount', {
          count: labelCount,
          label: labelString,
        })}
        confirmingLabel={t('general:deleting')}
        heading={t('general:confirmDeletion')}
        modalSlug={confirmManyDeleteDrawerSlug}
        onConfirm={handleDelete}
      />
    </React.Fragment>
  )
}
