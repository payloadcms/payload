'use client'
import type React from 'react'

import { Modal, useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import { useRouter } from 'next/navigation.js'
import { useCallback, useState } from 'react'

import { useAuth } from '../../providers/Auth/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useRouteCache } from '../../providers/RouteCache/index.js'
import { useSearchParams } from '../../providers/SearchParams/index.js'
import { SelectAllStatus, useSelection } from '../../providers/Selection/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { requests } from '../../utilities/api.js'
import { Button } from '../Button/index.js'
import { Pill } from '../Pill/index.js'
import './index.scss'

const baseClass = 'unpublish-many'

import type { ClientCollectionConfig } from 'payload'

import { toast } from 'sonner'

export type UnpublishManyProps = {
  collection: ClientCollectionConfig
}

export const UnpublishMany: React.FC<UnpublishManyProps> = (props) => {
  const { collection: { slug, labels: { plural }, versions } = {} } = props

  const {
    config: {
      routes: { api },
      serverURL,
    },
  } = useConfig()

  const { permissions } = useAuth()
  const { toggleModal } = useModal()
  const { i18n, t } = useTranslation()
  const { getQueryParams, selectAll } = useSelection()
  const [submitted, setSubmitted] = useState(false)
  const { stringifyParams } = useSearchParams()
  const router = useRouter()
  const { clearRouteCache } = useRouteCache()

  const collectionPermissions = permissions?.collections?.[slug]
  const hasPermission = collectionPermissions?.update?.permission

  const modalSlug = `unpublish-${slug}`

  const addDefaultError = useCallback(() => {
    toast.error(t('error:unknown'))
  }, [t])

  const handleUnpublish = useCallback(async () => {
    setSubmitted(true)
    await requests
      .patch(`${serverURL}${api}/${slug}${getQueryParams({ _status: { not_equals: 'draft' } })}`, {
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
          toggleModal(modalSlug)
          if (res.status < 400) {
            toast.success(t('general:updatedSuccessfully'))
            router.replace(
              stringifyParams({
                params: {
                  page: selectAll ? '1' : undefined,
                },
              }),
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
        } catch (e) {
          return addDefaultError()
        }
      })
  }, [
    addDefaultError,
    api,
    getQueryParams,
    i18n.language,
    modalSlug,
    selectAll,
    serverURL,
    slug,
    t,
    toggleModal,
    router,
    clearRouteCache,
    stringifyParams,
  ])

  if (!versions?.drafts || selectAll === SelectAllStatus.None || !hasPermission) {
    return null
  }
}
