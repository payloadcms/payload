'use client'
import { getTranslation } from '@payloadcms/translations'
import { Button, Modal, Pill, useConfig, useModal, useTranslation } from '@payloadcms/ui/client'
import { requests } from '@payloadcms/ui/shared'
import { useRouter } from 'next/navigation.js'
import React, { Fragment, useCallback, useState } from 'react'
import { toast } from 'sonner'

import type { Props } from './types.js'

import { MinimalTemplate } from '../../../templates/Minimal/index.js'
import './index.scss'

const baseClass = 'restore-version'
const modalSlug = 'restore-version'

const Restore: React.FC<Props> = ({
  className,
  collectionSlug,
  globalSlug,
  label,
  originalDocID,
  versionDate,
  versionID,
}) => {
  const {
    routes: { admin, api },
    serverURL,
  } = useConfig()
  const { toggleModal } = useModal()
  const [processing, setProcessing] = useState(false)
  const router = useRouter()
  const { i18n, t } = useTranslation()

  const restoreMessage = t('version:aboutToRestoreGlobal', {
    label: getTranslation(label, i18n),
    versionDate,
  })

  let fetchURL = `${serverURL}${api}`
  let redirectURL: string

  if (collectionSlug) {
    fetchURL = `${fetchURL}/${collectionSlug}/versions/${versionID}`
    redirectURL = `${admin}/collections/${collectionSlug}/${originalDocID}`
  }

  if (globalSlug) {
    fetchURL = `${fetchURL}/globals/${globalSlug}/versions/${versionID}`
    redirectURL = `${admin}/globals/${globalSlug}`
  }

  const handleRestore = useCallback(async () => {
    setProcessing(true)

    const res = await requests.post(fetchURL, {
      headers: {
        'Accept-Language': i18n.language,
      },
    })

    if (res.status === 200) {
      const json = await res.json()
      toast.success(json.message)
      router.push(redirectURL)
    } else {
      toast.error(t('version:problemRestoringVersion'))
    }
  }, [fetchURL, redirectURL, t, i18n, router])

  return (
    <Fragment>
      <Pill
        className={[baseClass, className].filter(Boolean).join(' ')}
        onClick={() => toggleModal(modalSlug)}
      >
        {t('version:restoreThisVersion')}
      </Pill>
      <Modal className={`${baseClass}__modal`} slug={modalSlug}>
        <MinimalTemplate className={`${baseClass}__modal-template`}>
          <h1>{t('version:confirmVersionRestoration')}</h1>
          <p>{restoreMessage}</p>
          <Button
            buttonStyle="secondary"
            onClick={processing ? undefined : () => toggleModal(modalSlug)}
            type="button"
          >
            {t('general:cancel')}
          </Button>
          <Button onClick={processing ? undefined : handleRestore}>
            {processing ? t('version:restoring') : t('general:confirm')}
          </Button>
        </MinimalTemplate>
      </Modal>
    </Fragment>
  )
}

export default Restore
