import type { Where } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { useRouter, useSearchParams } from 'next/navigation.js'
import { combineWhereConstraints, formatAdminURL, mergeListSearchAndWhere } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { useCallback } from 'react'
import { toast } from 'sonner'

import type { UnpublishManyProps } from './index.js'

import { useConfig } from '../../providers/Config/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useRouteCache } from '../../providers/RouteCache/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { requests } from '../../utilities/api.js'
import { parseSearchParams } from '../../utilities/parseSearchParams.js'
import { ConfirmationModal } from '../ConfirmationModal/index.js'

type UnpublishManyDrawerContentProps = {
  drawerSlug: string
  ids: (number | string)[]
  onSuccess?: () => void
  selectAll: boolean
  where?: Where
} & UnpublishManyProps

export function UnpublishManyDrawerContent(props: UnpublishManyDrawerContentProps) {
  const {
    collection,
    collection: { slug, labels: { plural, singular } } = {},
    drawerSlug,
    ids,
    onSuccess,
    selectAll,
    where,
  } = props

  const {
    config: {
      routes: { api },
    },
  } = useConfig()
  const { code: locale } = useLocale()
  const { i18n, t } = useTranslation()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { clearRouteCache } = useRouteCache()
  const addDefaultError = useCallback(() => {
    toast.error(t('error:unknown'))
  }, [t])

  const queryString = React.useMemo((): string => {
    const whereConstraints: Where[] = [
      {
        _status: {
          not_equals: 'draft',
        },
      },
    ]

    if (where) {
      whereConstraints.push(where)
    }

    const queryWithSearch = mergeListSearchAndWhere({
      collectionConfig: collection,
      search: searchParams.get('search'),
    })

    if (queryWithSearch) {
      whereConstraints.push(queryWithSearch)
    }

    if (!selectAll) {
      // If we're not selecting all, we need to select specific docs
      whereConstraints.push({
        id: {
          in: ids || [],
        },
      })
    }

    return qs.stringify(
      {
        locale,
        select: {},
        where: combineWhereConstraints(whereConstraints),
      },
      { addQueryPrefix: true },
    )
  }, [collection, searchParams, selectAll, ids, locale, where])

  const handleUnpublish = useCallback(async () => {
    const url = formatAdminURL({
      apiRoute: api,
      path: `/${slug}${queryString}`,
    })
    await requests
      .patch(url, {
        body: JSON.stringify({
          _status: 'draft',
        }),
        headers: {
          'Accept-Language': i18n.language,
          'Content-Type': 'application/json',
        },
      })
      .then(async (res) => {
        try {
          const json = await res.json()

          const deletedDocs = json?.docs.length || 0
          const successLabel = deletedDocs > 1 ? plural : singular

          if (res.status < 400 || deletedDocs > 0) {
            toast.success(
              t('general:updatedCountSuccessfully', {
                count: deletedDocs,
                label: getTranslation(successLabel, i18n),
              }),
            )

            if (json?.errors.length > 0) {
              toast.error(json.message, {
                description: json.errors.map((error) => error.message).join('\n'),
              })
            }

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

            if (typeof onSuccess === 'function') {
              onSuccess()
            }

            return null
          }

          if (json.errors) {
            json.errors.forEach((error) => toast.error(error.message))
          } else {
            addDefaultError()
          }
          return false
        } catch (_err) {
          return addDefaultError()
        }
      })
  }, [
    api,
    slug,
    queryString,
    i18n,
    plural,
    singular,
    t,
    router,
    searchParams,
    selectAll,
    clearRouteCache,
    addDefaultError,
    onSuccess,
  ])

  return (
    <ConfirmationModal
      body={t('version:aboutToUnpublishSelection', { label: getTranslation(plural, i18n) })}
      confirmingLabel={t('version:unpublishing')}
      heading={t('version:confirmUnpublish')}
      modalSlug={drawerSlug}
      onConfirm={handleUnpublish}
    />
  )
}
