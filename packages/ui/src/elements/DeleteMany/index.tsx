'use client'
import type { ClientCollectionConfig, ViewTypes, Where } from '@ruya.sa/payload'

import { useModal } from '@faceless-ui/modal'
import { getTranslation } from '@ruya.sa/translations'
import { useRouter, useSearchParams } from 'next/navigation.js'
import { formatAdminURL, mergeListSearchAndWhere } from '@ruya.sa/payload/shared'
import * as qs from 'qs-esm'
import React from 'react'
import { toast } from 'sonner'

import { CheckboxInput } from '../../fields/Checkbox/Input.js'
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
import { Translation } from '../Translation/index.js'
import './index.scss'

export type Props = {
  collection: ClientCollectionConfig
  /**
   * When multiple DeleteMany components are rendered on the page, this will differentiate them.
   */
  modalPrefix?: string
  /**
   * When multiple PublishMany components are rendered on the page, this will differentiate them.
   */
  title?: string
  viewType?: ViewTypes
}

export const DeleteMany: React.FC<Props> = (props) => {
  const { viewType } = props
  const { collection: { slug, trash } = {}, modalPrefix } = props

  const { permissions } = useAuth()
  const { count, selectAll, selectedIDs, toggleAll } = useSelection()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { clearRouteCache } = useRouteCache()

  const collectionPermissions = permissions?.collections?.[slug]
  const hasDeletePermission = collectionPermissions?.delete

  const selectingAll = selectAll === SelectAllStatus.AllAvailable

  const ids = selectingAll ? [] : selectedIDs

  if (selectAll === SelectAllStatus.None || !hasDeletePermission) {
    return null
  }

  const baseWhere = parseSearchParams(searchParams)?.where as Where

  const finalWhere =
    viewType === 'trash'
      ? {
          and: [
            ...(Array.isArray(baseWhere?.and) ? baseWhere.and : baseWhere ? [baseWhere] : []),
            { deletedAt: { exists: true } },
          ],
        }
      : baseWhere

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
        modalPrefix={modalPrefix}
        search={parseSearchParams(searchParams)?.search as string}
        selections={{
          [slug]: {
            all: selectAll === SelectAllStatus.AllAvailable,
            ids,
            totalCount: selectingAll ? count : ids.length,
          },
        }}
        trash={trash}
        viewType={viewType}
        where={finalWhere}
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
   * When multiple DeleteMany components are rendered on the page, this will differentiate them.
   */
  modalPrefix?: string
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
  trash?: boolean
  viewType?: ViewTypes
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
export function DeleteMany_v4({
  afterDelete,
  modalPrefix,
  search,
  selections,
  trash,
  viewType,
  where,
}: DeleteMany_v4Props) {
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

  const [deletePermanently, setDeletePermanently] = React.useState(false)
  const confirmManyDeleteDrawerSlug = `${modalPrefix ? `${modalPrefix}-` : ''}confirm-delete-many-docs`

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
            whereConstraint =
              viewType === 'trash'
                ? {
                    and: [
                      ...(Array.isArray(where.and) ? where.and : [where]),
                      { deletedAt: { exists: true } },
                    ],
                  }
                : where
          } else {
            whereConstraint =
              viewType === 'trash'
                ? {
                    and: [{ id: { not_equals: '' } }, { deletedAt: { exists: true } }],
                  }
                : {
                    id: { not_equals: '' },
                  }
          }
        } else {
          // selecting specific documents
          whereConstraint = {
            and: [
              { id: { in: ids } },
              ...(viewType === 'trash' ? [{ deletedAt: { exists: true } }] : []),
            ],
          }
        }

        const url = formatAdminURL({
          apiRoute: api,
          path: `/${relationTo}${qs.stringify(
            {
              limit: 0,
              locale,
              select: {},
              where: mergeListSearchAndWhere({
                collectionConfig,
                search,
                where: whereConstraint,
              }),
              ...(viewType === 'trash' ? { trash: true } : {}),
            },
            { addQueryPrefix: true },
          )}`,
        })

        const deleteManyResponse =
          viewType === 'trash' || deletePermanently || !collectionConfig.trash
            ? await requests.delete(url, {
                headers: {
                  'Accept-Language': i18n.language,
                  'Content-Type': 'application/json',
                },
              })
            : await requests.patch(url, {
                body: JSON.stringify({
                  deletedAt: new Date().toISOString(),
                }),
                headers: {
                  'Accept-Language': i18n.language,
                  'Content-Type': 'application/json',
                },
              })

        try {
          const { plural, singular } = collectionConfig.labels
          const json = await deleteManyResponse.json()

          const deletedDocs = json?.docs.length || 0
          const successLabel = deletedDocs > 1 ? plural : singular

          if (deleteManyResponse.status < 400 || deletedDocs > 0) {
            const wasTrashed = collectionConfig.trash && !deletePermanently && viewType !== 'trash'

            let successKey:
              | 'general:deletedCountSuccessfully'
              | 'general:permanentlyDeletedCountSuccessfully'
              | 'general:trashedCountSuccessfully'

            if (wasTrashed) {
              successKey = 'general:trashedCountSuccessfully'
            } else if (viewType === 'trash' || deletePermanently) {
              successKey = 'general:permanentlyDeletedCountSuccessfully'
            } else {
              successKey = 'general:deletedCountSuccessfully'
            }

            toast.success(
              t(successKey, {
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
  }, [
    selections,
    afterDelete,
    collections,
    deletePermanently,
    locale,
    search,
    serverURL,
    api,
    i18n,
    viewType,
    where,
    t,
  ])

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
        body={
          <React.Fragment>
            <p>
              {trash ? (
                viewType === 'trash' ? (
                  <Translation
                    elements={{
                      '0': ({ children }) => <strong>{children}</strong>,
                      '1': ({ children }) => <strong>{children}</strong>,
                    }}
                    i18nKey="general:aboutToPermanentlyDeleteTrash"
                    t={t}
                    variables={{
                      count: labelCount ?? 0,
                      label: labelString,
                    }}
                  />
                ) : (
                  t('general:aboutToTrashCount', { count: labelCount, label: labelString })
                )
              ) : (
                t('general:aboutToDeleteCount', { count: labelCount, label: labelString })
              )}
            </p>
            {trash && viewType !== 'trash' && (
              <div className="delete-documents__checkbox">
                <CheckboxInput
                  checked={deletePermanently}
                  id="delete-forever"
                  label={t('general:deletePermanently')}
                  name="delete-forever"
                  onToggle={(e) => setDeletePermanently(e.target.checked)}
                />
              </div>
            )}
          </React.Fragment>
        }
        confirmingLabel={t('general:deleting')}
        heading={t('general:confirmDeletion')}
        modalSlug={confirmManyDeleteDrawerSlug}
        onConfirm={handleDelete}
      />
    </React.Fragment>
  )
}
