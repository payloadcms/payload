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
import './index.scss'

const confirmManyRestoreDrawerSlug = `confirm-restore-many-docs`

const baseClass = 'restore-many'

export type Props = {
  collection: ClientCollectionConfig
  viewType?: ViewTypes
}

export const RestoreMany: React.FC<Props> = (props) => {
  const { collection: { slug } = {}, viewType } = props

  const { permissions } = useAuth()
  const {
    config: { collections, routes, serverURL },
  } = useConfig()
  const { code: locale } = useLocale()
  const router = useRouter()
  const { clearRouteCache } = useRouteCache()
  const searchParams = useSearchParams()
  const { count, getSelectedIds, selectAll, toggleAll } = useSelection()
  const { openModal } = useModal()

  const { i18n, t } = useTranslation()

  const [restoreAsPublished, setRestoreAsPublished] = React.useState(false)

  const collectionPermissions = permissions?.collections?.[slug]
  const hasUpdatePermission = collectionPermissions?.update

  if (selectAll === SelectAllStatus.None || !hasUpdatePermission || viewType !== 'trash') {
    return null
  }

  const selectingAll = selectAll === SelectAllStatus.AllAvailable
  const selectedIDs = !selectingAll ? getSelectedIds() : []

  const baseWhere = parseSearchParams(searchParams)?.where as Where

  const finalWhere = {
    and: [
      ...(Array.isArray(baseWhere?.and) ? baseWhere.and : baseWhere ? [baseWhere] : []),
      { deletedAt: { exists: true } },
    ],
  }

  const handleRestore = async () => {
    const collectionConfig = collections.find((c) => c.slug === slug)
    if (!collectionConfig) {
      return
    }

    let whereConstraint: Where

    if (selectingAll) {
      whereConstraint = finalWhere
    } else {
      whereConstraint = {
        and: [{ id: { in: selectedIDs } }, { deletedAt: { exists: true } }],
      }
    }

    const url = formatAdminURL({
      apiRoute: routes.api,
      path: `/${slug}${qs.stringify(
        {
          limit: 0,
          locale,
          select: {},
          trash: true, // Ensure trashed docs are returned
          where: mergeListSearchAndWhere({
            collectionConfig,
            search: parseSearchParams(searchParams)?.search as string,
            where: whereConstraint,
          }),
        },
        { addQueryPrefix: true },
      )}`,
    })

    const body: Record<string, unknown> = {
      deletedAt: null,
    }

    // Only include _status if drafts are enabled
    if (collectionConfig?.versions?.drafts) {
      body._status = restoreAsPublished ? 'published' : 'draft'
    }

    const restoreManyResponse = await requests.patch(url, {
      body: JSON.stringify(body),
      headers: {
        'Accept-Language': i18n.language,
        'Content-Type': 'application/json',
      },
    })

    try {
      const { plural, singular } = collectionConfig.labels
      const json = await restoreManyResponse.json()

      const restoredDocs = json?.docs?.length || 0
      const successLabel = restoredDocs > 1 ? plural : singular

      if (restoreManyResponse.status < 400 || restoredDocs > 0) {
        toast.success(
          t('general:restoredCountSuccessfully', {
            count: restoredDocs,
            label: getTranslation(successLabel, i18n),
          }),
        )
      }

      if (json?.errors?.length > 0) {
        toast.error(json.message, {
          description: json.errors.map((e) => e.message).join('\n'),
        })
      }
    } catch (err) {
      toast.error(t('error:unknown'))
    }

    toggleAll()

    router.replace(
      qs.stringify(
        {
          ...parseSearchParams(searchParams),
          page: selectingAll ? '1' : undefined,
        },
        { addQueryPrefix: true },
      ),
    )

    clearRouteCache()
  }

  const collectionConfig = collections.find(({ slug: s }) => s === slug)

  const labelString = getTranslation(
    count === 1 ? collectionConfig.labels.singular : collectionConfig.labels.plural,
    i18n,
  )

  return (
    <React.Fragment>
      <ListSelectionButton
        aria-label={t('general:restore')}
        className="restore-documents__toggle"
        onClick={() => {
          openModal(confirmManyRestoreDrawerSlug)
        }}
      >
        {t('general:restore')}
      </ListSelectionButton>
      <ConfirmationModal
        body={
          <React.Fragment>
            {t(
              collectionConfig?.versions?.drafts
                ? 'general:aboutToRestoreAsDraftCount'
                : 'general:aboutToRestoreCount',
              {
                count,
                label: labelString,
              },
            )}
            {collectionConfig?.versions?.drafts && (
              <div className={`${baseClass}__checkbox`}>
                <CheckboxInput
                  checked={restoreAsPublished}
                  id="restore-as-published-many"
                  label={t('general:restoreAsPublished')}
                  name="restore-as-published-many"
                  onToggle={(e) => setRestoreAsPublished(e.target.checked)}
                />
              </div>
            )}
          </React.Fragment>
        }
        className={baseClass}
        confirmingLabel={t('general:restoring')}
        heading={t('general:confirmRestoration')}
        modalSlug={confirmManyRestoreDrawerSlug}
        onConfirm={handleRestore}
      />
    </React.Fragment>
  )
}
