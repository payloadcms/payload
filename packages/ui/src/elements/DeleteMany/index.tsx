'use client'
import type { ClientCollectionConfig } from 'payload'

import { Modal, useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import { useRouter, useSearchParams } from 'next/navigation.js'
import * as qs from 'qs-esm'
import React, { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { useAuth } from '../../providers/Auth/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useRouteCache } from '../../providers/RouteCache/index.js'
import { SelectAllStatus, useSelection } from '../../providers/Selection/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { requests } from '../../utilities/api.js'
import { mergeListSearchAndWhere } from '../../utilities/mergeListSearchAndWhere.js'
import { Button } from '../Button/index.js'
import './index.scss'
import { Pill } from '../Pill/index.js'

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
  const { toggleModal } = useModal()
  const { count, getQueryParams, selectAll, toggleAll } = useSelection()
  const { i18n, t } = useTranslation()
  const [deleting, setDeleting] = useState(false)
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
    setDeleting(true)

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
          toggleModal(modalSlug)

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
            addDefaultError()
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
    modalSlug,
    plural,
    router,
    selectAll,
    serverURL,
    singular,
    slug,
    t,
    toggleAll,
    toggleModal,
    clearRouteCache,
    collection,
  ])

  if (selectAll === SelectAllStatus.None || !hasDeletePermission) {
    return null
  }

  return (
    <React.Fragment>
      <Pill
        className={`${baseClass}__toggle`}
        onClick={() => {
          setDeleting(false)
          toggleModal(modalSlug)
        }}
      >
        {t('general:delete')}
      </Pill>
      <Modal className={baseClass} slug={modalSlug}>
        <div className={`${baseClass}__wrapper`}>
          <div className={`${baseClass}__content`}>
            <h1>{t('general:confirmDeletion')}</h1>
            <p>{t('general:aboutToDeleteCount', { count, label: getTranslation(plural, i18n) })}</p>
          </div>
          <div className={`${baseClass}__controls`}>
            <Button
              buttonStyle="secondary"
              id="confirm-cancel"
              onClick={deleting ? undefined : () => toggleModal(modalSlug)}
              size="large"
              type="button"
            >
              {t('general:cancel')}
            </Button>
            <Button id="confirm-delete" onClick={deleting ? undefined : handleDelete} size="large">
              {deleting ? t('general:deleting') : t('general:confirm')}
            </Button>
          </div>
        </div>
      </Modal>
    </React.Fragment>
  )
}
