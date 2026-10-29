'use client'

import type { ClientCollectionConfig, ClientGlobalConfig, SanitizedCollectionConfig } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { formatAdminURL, hasDraftsEnabled, hasLocalizeStatusEnabled } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { Fragment, useCallback } from 'react'
import { toast } from 'sonner'

import { Button } from '../../../elements/Button/index.js'
import { ConfirmationModal } from '../../../elements/ConfirmationModal/index.js'
import { useModal } from '../../../elements/Modal/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useRouter } from '../../../providers/RouterAdapter/index.js'
import { useRouteTransition } from '../../../providers/RouteTransition/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { requests } from '../../../utilities/api.js'
import './index.css'

const baseClass = 'restore-version'
const modalSlug = 'restore-version'

type Props = {
  className?: string
  collectionConfig?: ClientCollectionConfig
  globalConfig?: ClientGlobalConfig
  label: SanitizedCollectionConfig['labels']['singular']
  originalDocID: number | string
  versionDateFormatted: string
  versionID: string
}

export const Restore: React.FC<Props> = ({
  className,
  collectionConfig,
  globalConfig,
  label,
  originalDocID,
  versionDateFormatted,
  versionID,
}) => {
  const {
    config: {
      routes: { admin: adminRoute, api: apiRoute },
    },
  } = useConfig()

  const { toggleModal } = useModal()
  const router = useRouter()
  const { i18n, t } = useTranslation()
  const { startRouteTransition } = useRouteTransition()
  const entityConfig = collectionConfig || globalConfig
  const shouldRestoreAsDraft = Boolean(entityConfig && hasDraftsEnabled(entityConfig))
  const restoreLabel = t(
    shouldRestoreAsDraft ? 'version:restoreAsDraft' : 'version:restoreThisVersion',
  )

  const restoreMessage = t(
    shouldRestoreAsDraft
      ? entityConfig && hasLocalizeStatusEnabled(entityConfig)
        ? 'version:aboutToRestoreAsDraftAllLocales'
        : 'version:aboutToRestoreAsDraft'
      : globalConfig
        ? 'version:aboutToRestoreGlobal'
        : 'version:aboutToRestore',
    {
      label: getTranslation(label, i18n),
      versionDate: versionDateFormatted,
    },
  )

  const handleRestore = useCallback(async () => {
    let fetchURL: string
    let redirectURL: string
    const queryString = qs.stringify({ draft: shouldRestoreAsDraft }, { addQueryPrefix: true })

    if (collectionConfig) {
      fetchURL = formatAdminURL({
        apiRoute,
        path: `/${collectionConfig.slug}/versions/${versionID}${queryString}`,
      })
      redirectURL = formatAdminURL({
        adminRoute,
        path: `/collections/${collectionConfig.slug}/${originalDocID}`,
      })
    } else if (globalConfig) {
      fetchURL = formatAdminURL({
        apiRoute,
        path: `/globals/${globalConfig.slug}/versions/${versionID}${queryString}`,
      })
      redirectURL = formatAdminURL({
        adminRoute,
        path: `/globals/${globalConfig.slug}`,
      })
    } else {
      return
    }

    const res = await requests.post(fetchURL, {
      headers: {
        'Accept-Language': i18n.language,
      },
    })

    if (res.status === 200) {
      const json = await res.json()
      toast.success(json.message)
      return startRouteTransition(() => router.push(redirectURL))
    } else {
      toast.error(t('version:problemRestoringVersion'))
    }
  }, [
    apiRoute,
    collectionConfig,
    globalConfig,
    i18n.language,
    versionID,
    shouldRestoreAsDraft,
    adminRoute,
    originalDocID,
    startRouteTransition,
    router,
    t,
  ])

  return (
    <Fragment>
      <div className={[baseClass, className].filter(Boolean).join(' ')}>
        <Button buttonStyle="primary" onClick={() => toggleModal(modalSlug)} size="medium">
          {restoreLabel}
        </Button>
      </div>
      <ConfirmationModal
        body={restoreMessage}
        confirmingLabel={t('version:restoring')}
        heading={shouldRestoreAsDraft ? restoreLabel : t('version:confirmVersionRestoration')}
        modalSlug={modalSlug}
        onConfirm={handleRestore}
      />
    </Fragment>
  )
}
