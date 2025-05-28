import type { Where } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { useRouter, useSearchParams } from 'next/navigation.js'
import { combineWhereConstraints, mergeListSearchAndWhere } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { useCallback } from 'react'
import { toast } from 'sonner'

import type { PublishManyProps } from './index.js'

import { useConfig } from '../../providers/Config/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useRouteCache } from '../../providers/RouteCache/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { requests } from '../../utilities/api.js'
import { parseSearchParams } from '../../utilities/parseSearchParams.js'
import { ConfirmationModal } from '../ConfirmationModal/index.js'

type PublishManyDrawerContentProps = {
  drawerSlug: string
  ids: (number | string)[]
  selectAll: boolean
} & PublishManyProps
export function PublishManyDrawerContent(props: PublishManyDrawerContentProps) {
  const {
    collection,
    collection: { slug, labels: { plural, singular } } = {},
    drawerSlug,
    ids,
    selectAll,
  } = props

  const { clearRouteCache } = useRouteCache()
  const {
    config: {
      routes: { api },
      serverURL,
    },
  } = useConfig()
  const { code: locale } = useLocale()

  const router = useRouter()
  const searchParams = useSearchParams()
  const { i18n, t } = useTranslation()

  const addDefaultError = useCallback(() => {
    toast.error(t('error:unknown'))
  }, [t])

  const queryString = React.useMemo((): string => {
    const whereConstraints: Where[] = [
      {
        _status: {
          not_equals: 'published',
        },
      },
    ]

    const queryWithSearch = mergeListSearchAndWhere({
      collectionConfig: collection,
      search: searchParams.get('search'),
    })

    if (queryWithSearch) {
      whereConstraints.push(queryWithSearch)
    }

    if (selectAll) {
      // Match the current filter/search, or default to all docs
      whereConstraints.push(
        (parseSearchParams(searchParams)?.where as Where) || {
          id: {
            exists: true,
          },
        },
      )
    } else {
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
        where: combineWhereConstraints(whereConstraints),
      },
      { addQueryPrefix: true },
    )
  }, [collection, searchParams, selectAll, ids, locale])

  const handlePublish = useCallback(async () => {
    await requests
      .patch(`${serverURL}${api}/${slug}${queryString}&draft=true`, {
        body: JSON.stringify({
          _status: 'published',
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
    serverURL,
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
  ])

  return (
    <ConfirmationModal
      body={t('version:aboutToPublishSelection', { label: getTranslation(plural, i18n) })}
      cancelLabel={t('general:cancel')}
      confirmingLabel={t('version:publishing')}
      confirmLabel={t('general:confirm')}
      heading={t('version:confirmPublish')}
      modalSlug={drawerSlug}
      onConfirm={handlePublish}
    />
  )
}
