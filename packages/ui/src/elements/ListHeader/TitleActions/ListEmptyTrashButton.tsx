'use client'
import type { ClientCollectionConfig } from '@ruya.sa/payload'

import { useModal } from '@faceless-ui/modal'
import { getTranslation } from '@ruya.sa/translations'
import { useRouter, useSearchParams } from 'next/navigation.js'
import { formatAdminURL } from '@ruya.sa/payload/shared'
import * as qs from 'qs-esm'
import React from 'react'
import { toast } from 'sonner'

import { useConfig } from '../../../providers/Config/index.js'
import { useLocale } from '../../../providers/Locale/index.js'
import { useRouteCache } from '../../../providers/RouteCache/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { requests } from '../../../utilities/api.js'
import { Button } from '../../Button/index.js'
import { ConfirmationModal } from '../../ConfirmationModal/index.js'
import { Translation } from '../../Translation/index.js'

const confirmEmptyTrashSlug = 'confirm-empty-trash'

export function ListEmptyTrashButton({
  collectionConfig,
  hasDeletePermission,
}: {
  collectionConfig: ClientCollectionConfig
  hasDeletePermission: boolean
}) {
  const { i18n, t } = useTranslation()
  const { code: locale } = useLocale()
  const { config } = useConfig()
  const { openModal } = useModal()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { clearRouteCache } = useRouteCache()

  const [trashCount, setTrashCount] = React.useState<null | number>(null)

  React.useEffect(() => {
    const fetchTrashCount = async () => {
      const queryString = qs.stringify(
        {
          depth: 0,
          limit: 0,
          locale,
          trash: true,
          where: {
            deletedAt: {
              exists: true,
            },
          },
        },
        { addQueryPrefix: true },
      )

      try {
        const res = await requests.get(
          formatAdminURL({
            apiRoute: config.routes.api,
            path: `/${collectionConfig.slug}${queryString}`,
          }),
          {
            headers: {
              'Accept-Language': i18n.language,
              'Content-Type': 'application/json',
            },
          },
        )

        const json = await res.json()
        setTrashCount(json?.totalDocs ?? 0)
      } catch {
        setTrashCount(0)
      }
    }

    void fetchTrashCount()
  }, [collectionConfig.slug, config, i18n.language, locale])

  const handleEmptyTrash = React.useCallback(async () => {
    if (!hasDeletePermission) {
      return
    }

    const { slug, labels } = collectionConfig

    const queryString = qs.stringify(
      {
        limit: 0,
        locale,
        trash: true,
        where: {
          deletedAt: {
            exists: true,
          },
        },
      },
      { addQueryPrefix: true },
    )

    const res = await requests.delete(
      formatAdminURL({
        apiRoute: config.routes.api,
        path: `/${slug}${queryString}`,
      }),
      {
        headers: {
          'Accept-Language': i18n.language,
          'Content-Type': 'application/json',
        },
      },
    )

    try {
      const json = await res.json()
      const deletedCount = json?.docs?.length || 0

      if (res.status < 400) {
        toast.success(
          t('general:permanentlyDeletedCountSuccessfully', {
            count: deletedCount,
            label: getTranslation(labels?.plural, i18n),
          }),
        )
      }

      if (json?.errors?.length > 0) {
        toast.error(json.message, {
          description: json.errors.map((err) => err.message).join('\n'),
        })
      }

      router.replace(
        qs.stringify(
          {
            ...Object.fromEntries(searchParams.entries()),
            page: '1',
          },
          { addQueryPrefix: true },
        ),
      )

      clearRouteCache()
    } catch {
      toast.error(t('error:unknown'))
    }
  }, [
    collectionConfig,
    config,
    hasDeletePermission,
    i18n,
    t,
    locale,
    searchParams,
    router,
    clearRouteCache,
  ])

  return (
    <React.Fragment>
      <Button
        aria-label={t('general:emptyTrashLabel', {
          label: getTranslation(collectionConfig?.labels?.plural, i18n),
        })}
        buttonStyle="pill"
        disabled={trashCount === 0}
        id="empty-trash-button"
        key="empty-trash-button"
        onClick={() => {
          openModal(confirmEmptyTrashSlug)
        }}
        size="small"
      >
        {t('general:emptyTrash')}
      </Button>
      <ConfirmationModal
        body={
          <Translation
            elements={{
              '0': ({ children }) => <strong>{children}</strong>,
              '1': ({ children }) => <strong>{children}</strong>,
            }}
            i18nKey="general:aboutToPermanentlyDeleteTrash"
            t={t}
            variables={{
              count: trashCount ?? 0,
              label: getTranslation(
                trashCount === 1
                  ? collectionConfig.labels?.singular
                  : collectionConfig.labels?.plural,
                i18n,
              ),
            }}
          />
        }
        confirmingLabel={t('general:deleting')}
        heading={t('general:confirmDeletion')}
        modalSlug={confirmEmptyTrashSlug}
        onConfirm={handleEmptyTrash}
      />
    </React.Fragment>
  )
}
