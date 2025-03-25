'use client'
import type { ClientCollectionConfig } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import { useRouter, useSearchParams } from 'next/navigation.js'
import { mergeListSearchAndWhere } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { useCallback } from 'react'
import { toast } from 'sonner'

import { useAuth } from '../../providers/Auth/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useRouteCache } from '../../providers/RouteCache/index.js'
import { SelectAllStatus, useSelection } from '../../providers/Selection/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { requests } from '../../utilities/api.js'
import { ConfirmationModal } from '../ConfirmationModal/index.js'
import './index.scss'

const baseClass = 'delete-documents'

export type Props = {
  collection: ClientCollectionConfig
  title?: string
}

export const DeleteMany: React.FC<Props> = (props) => {
  const { collection, collection: { slug, labels: { plural, singular } } = {} } = props

  const { permissions } = useAuth()
  const {
    config: {
      routes: { api },
      serverURL,
    },
  } = useConfig()
  const { openModal } = useModal()
  const { count, getQueryParams, selectAll, toggleAll } = useSelection()
  const { i18n, t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { clearRouteCache } = useRouteCache()

  const collectionPermissions = permissions?.collections?.[slug]
  const hasDeletePermission = collectionPermissions?.delete

  const modalSlug = `delete-${slug}`

  const addDefaultError = useCallback(() => {
    toast.error(t('error:unknown'))
  }, [t])

  const handleDelete = useCallback(async () => {
    const queryWithSearch = mergeListSearchAndWhere({
      collectionConfig: collection,
      search: searchParams.get('search'),
    })

    const queryString = getQueryParams(queryWithSearch)

    await requests
      .delete(`${serverURL}${api}/${slug}${queryString}`, {
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
              t('general:deletedCountSuccessfully', {
                count: deletedDocs,
                label: getTranslation(successLabel, i18n),
              }),
            )

            if (json?.errors.length > 0) {
              toast.error(json.message, {
                description: json.errors.map((error) => error.message).join('\n'),
              })
            }

            toggleAll()

            router.replace(
              qs.stringify(
                {
                  page: selectAll ? '1' : undefined,
                },
                { addQueryPrefix: true },
              ),
            )

            clearRouteCache()

            return null
          }

          if (json.errors) {
            toast.error(json.message, {
              description: json.errors.map((error) => error.message).join('\n'),
            })
          } else {
            return addDefaultError()
          }
          return false
        } catch (_err) {
          return addDefaultError()
        }
      })
  }, [
    searchParams,
    addDefaultError,
    api,
    getQueryParams,
    i18n,
    plural,
    router,
    selectAll,
    serverURL,
    singular,
    slug,
    t,
    toggleAll,
    clearRouteCache,
    collection,
  ])

  if (selectAll === SelectAllStatus.None || !hasDeletePermission) {
    return null
  }

  return (
    <React.Fragment>
      <button
        className={`${baseClass}__toggle`}
        onClick={() => {
          openModal(modalSlug)
        }}
        type="button"
      >
        {t('general:delete')}
      </button>
      <ConfirmationModal
        body={t('general:aboutToDeleteCount', {
          count,
          label: getTranslation(count > 1 ? plural : singular, i18n),
        })}
        confirmingLabel={t('general:deleting')}
        heading={t('general:confirmDeletion')}
        modalSlug={modalSlug}
        onConfirm={handleDelete}
      />
    </React.Fragment>
  )
}
