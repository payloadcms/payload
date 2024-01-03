'use client'
import { Modal, useModal } from '@faceless-ui/modal'
import React, { Fragment, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'

import type { Props } from './types'

import { Button, MinimalTemplate, Pill, useConfig } from '@payloadcms/ui'
import { getTranslation } from 'payload/utilities'
// import { requests } from '../../../../api'
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
  const { i18n, t } = useTranslation('version')

  const restoreMessage = t('aboutToRestoreGlobal', {
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

    const res: any = {}

    // const res = await requests.post(fetchURL, {
    //   headers: {
    //     'Accept-Language': i18n.language,
    //   },
    // })

    if (res.status === 200) {
      const json = await res.json()
      toast.success(json.message)
      // history.push(redirectURL)
    } else {
      toast.error(t('problemRestoringVersion'))
    }
  }, [fetchURL, redirectURL, t, i18n])

  return (
    <Fragment>
      <Pill
        className={[baseClass, className].filter(Boolean).join(' ')}
        onClick={() => toggleModal(modalSlug)}
      >
        {t('restoreThisVersion')}
      </Pill>
      <Modal className={`${baseClass}__modal`} slug={modalSlug}>
        <MinimalTemplate className={`${baseClass}__modal-template`}>
          <h1>{t('confirmVersionRestoration')}</h1>
          <p>{restoreMessage}</p>
          <Button
            buttonStyle="secondary"
            onClick={processing ? undefined : () => toggleModal(modalSlug)}
            type="button"
          >
            {t('general:cancel')}
          </Button>
          <Button onClick={processing ? undefined : handleRestore}>
            {processing ? t('restoring') : t('general:confirm')}
          </Button>
        </MinimalTemplate>
      </Modal>
    </Fragment>
  )
}

export default Restore
