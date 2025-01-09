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
import { parseSearchParams } from '../../utilities/parseSearchParams.js'
import { Button } from '../Button/index.js'
import { Pill } from '../Pill/index.js'
import './index.scss'

const baseClass = 'publish-many'

export type PublishManyProps = {
  collection: ClientCollectionConfig
}

export const PublishMany: React.FC<PublishManyProps> = (props) => {
  const { clearRouteCache } = useRouteCache()

  const { collection: { slug, labels: { plural, singular }, versions } = {} } = props

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
  const router = useRouter()
  const searchParams = useSearchParams()

  const collectionPermissions = permissions?.collections?.[slug]
  const hasPermission = collectionPermissions?.update

  const modalSlug = `publish-${slug}`

  const addDefaultError = useCallback(() => {
    toast.error(t('error:unknown'))
  }, [t])

  const handlePublish = useCallback(async () => {
    setSubmitted(true)
    await requests
      .patch(
        `${serverURL}${api}/${slug}${getQueryParams({ _status: { not_equals: 'published' } })}&draft=true`,
        {
          body: JSON.stringify({
            _status: 'published',
          }),
          headers: {
            'Accept-Language': i18n.language,
            'Content-Type': 'application/json',
          },
        },
      )
      .then(async (res) => {
        try {
          const json = await res.json()
          toggleModal(modalSlug)

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

            clearRouteCache() // Use clearRouteCache instead of router.refresh, as we only need to clear the cache if the user has route caching enabled - clearRouteCache checks for this
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
    serverURL,
    api,
    slug,
    getQueryParams,
    i18n,
    toggleModal,
    modalSlug,
    plural,
    singular,
    t,
    router,
    searchParams,
    selectAll,
    clearRouteCache,
    addDefaultError,
  ])

  if (!versions?.drafts || selectAll === SelectAllStatus.None || !hasPermission) {
    return null
  }

  return (
    <React.Fragment>
      <Pill
        className={`${baseClass}__toggle`}
        onClick={() => {
          setSubmitted(false)
          toggleModal(modalSlug)
        }}
      >
        {t('version:publish')}
      </Pill>
      <Modal className={baseClass} slug={modalSlug}>
        <div className={`${baseClass}__wrapper`}>
          <div className={`${baseClass}__content`}>
            <h1>{t('version:confirmPublish')}</h1>
            <p>{t('version:aboutToPublishSelection', { label: getTranslation(plural, i18n) })}</p>
          </div>
          <div className={`${baseClass}__controls`}>
            <Button
              buttonStyle="secondary"
              id="confirm-cancel"
              onClick={submitted ? undefined : () => toggleModal(modalSlug)}
              size="large"
              type="button"
            >
              {t('general:cancel')}
            </Button>
            <Button
              id="confirm-publish"
              onClick={submitted ? undefined : handlePublish}
              size="large"
            >
              {submitted ? t('version:publishing') : t('general:confirm')}
            </Button>
          </div>
        </div>
      </Modal>
    </React.Fragment>
  )
}
