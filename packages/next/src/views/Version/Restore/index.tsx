'use client'

import type { ClientCollectionConfig, ClientGlobalConfig, SanitizedCollectionConfig } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import {
  Button,
  ConfirmationModal,
  PopupList,
  toast,
  useConfig,
  useModal,
  useRouteTransition,
  useTranslation,
} from '@payloadcms/ui'
import { requests } from '@payloadcms/ui/shared'
import { useRouter } from 'next/navigation.js'
import { formatAdminURL } from 'payload/shared'

import './index.scss'

import React, { Fragment, useCallback, useState } from 'react'

const baseClass = 'restore-version'
const modalSlug = 'restore-version'

type Props = {
  className?: string
  collectionConfig?: ClientCollectionConfig
  globalConfig?: ClientGlobalConfig
  label: SanitizedCollectionConfig['labels']['singular']
  originalDocID: number | string
  status?: string
  versionDateFormatted: string
  versionID: string
}

export const Restore: React.FC<Props> = ({
  className,
  collectionConfig,
  globalConfig,
  label,
  originalDocID,
  status,
  versionDateFormatted,
  versionID,
}) => {
  const {
    config: {
      routes: { admin: adminRoute, api: apiRoute },
      serverURL,
    },
  } = useConfig()

  const { toggleModal } = useModal()
  const router = useRouter()
  const { i18n, t } = useTranslation()
  const [draft, setDraft] = useState(false)
  const { startRouteTransition } = useRouteTransition()

  const restoreMessage = t('version:aboutToRestoreGlobal', {
    label: getTranslation(label, i18n),
    versionDate: versionDateFormatted,
  })

  const canRestoreAsDraft = status !== 'draft' && collectionConfig?.versions?.drafts

  const handleRestore = useCallback(async () => {
    let fetchURL = formatAdminURL({
      apiRoute,
      path: '',
    })
    let redirectURL: string

    if (collectionConfig) {
      fetchURL = `${fetchURL}/${collectionConfig.slug}/versions/${versionID}?draft=${draft}`
      redirectURL = formatAdminURL({
        adminRoute,
        path: `/collections/${collectionConfig.slug}/${originalDocID}`,
      })
    }

    if (globalConfig) {
      fetchURL = `${fetchURL}/globals/${globalConfig.slug}/versions/${versionID}?draft=${draft}`
      redirectURL = formatAdminURL({
        adminRoute,
        path: `/globals/${globalConfig.slug}`,
      })
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
    draft,
    adminRoute,
    originalDocID,
    startRouteTransition,
    router,
    t,
  ])

  return (
    <Fragment>
      <div className={[baseClass, className].filter(Boolean).join(' ')}>
        <Button
          buttonStyle="primary"
          className={[canRestoreAsDraft && `${baseClass}__restore-as-draft-button`]
            .filter(Boolean)
            .join(' ')}
          onClick={() => toggleModal(modalSlug)}
          size="xsmall"
          SubMenuPopupContent={
            canRestoreAsDraft
              ? () => (
                  <PopupList.ButtonGroup>
                    <PopupList.Button onClick={() => [setDraft(true), toggleModal(modalSlug)]}>
                      {t('version:restoreAsDraft')}
                    </PopupList.Button>
                  </PopupList.ButtonGroup>
                )
              : null
          }
        >
          {t('version:restoreThisVersion')}
        </Button>
      </div>
      <ConfirmationModal
        body={restoreMessage}
        confirmingLabel={t('version:restoring')}
        heading={t('version:confirmVersionRestoration')}
        modalSlug={modalSlug}
        onConfirm={handleRestore}
      />
    </Fragment>
  )
}
