'use client'
import * as facelessUIImport from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import { useRouter } from 'next/navigation.js'
import React, { useCallback, useState } from 'react'
import { toast } from 'react-toastify'

import type { Props } from './types.js'

import { useForm, useFormModified } from '../../forms/Form/context.js'
import { useConfig } from '../../providers/Config/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { MinimalTemplate } from '../../templates/Minimal/index.js'
import { requests } from '../../utilities/api.js'
import { Button } from '../Button/index.js'
import * as PopupList from '../Popup/PopupButtonList/index.js'
import './index.scss'

const baseClass = 'duplicate'

const Duplicate: React.FC<Props> = ({ id, slug, singularLabel }) => {
  const { Modal, useModal } = facelessUIImport

  const router = useRouter()
  const modified = useFormModified()
  const { toggleModal } = useModal()
  const { setModified } = useForm()
  const {
    routes: { api },
    serverURL,
  } = useConfig()
  const {
    routes: { admin },
  } = useConfig()
  const [hasClicked, setHasClicked] = useState<boolean>(false)
  const { i18n, t } = useTranslation()

  const modalSlug = `duplicate-${id}`

  const handleClick = useCallback(
    async (override = false) => {
      setHasClicked(true)

      if (modified && !override) {
        toggleModal(modalSlug)
        return
      }
      await requests
        .post(`${serverURL}${api}/${slug}/${id}/duplicate`, {
          body: JSON.stringify({}),
          headers: {
            'Accept-Language': i18n.language,
            'Content-Type': 'application/json',
            credentials: 'include',
          },
        })
        .then(async (res) => {
          const { doc, message } = await res.json()
          if (res.status < 400) {
            toast.success(
              message ||
                t('general:successfullyDuplicated', { label: getTranslation(singularLabel, i18n) }),
              {
                autoClose: 3000,
              },
            )
            setModified(false)
            router.push(`${admin}/collections/${slug}/${doc.id}`)
          } else {
            toast.error(
              message || t('error:unspecific', { label: getTranslation(singularLabel, i18n) }),
              { autoClose: 5000 },
            )
          }
        })
    },
    [
      modified,
      serverURL,
      api,
      slug,
      id,
      i18n,
      toggleModal,
      modalSlug,
      t,
      singularLabel,
      setModified,
      router,
      admin,
    ],
  )

  const confirm = useCallback(async () => {
    setHasClicked(false)
    await handleClick(true)
  }, [handleClick])

  return (
    <React.Fragment>
      <PopupList.Button id="action-duplicate" onClick={() => handleClick(false)}>
        {t('general:duplicate')}
      </PopupList.Button>
      {modified && hasClicked && (
        <Modal className={`${baseClass}__modal`} slug={modalSlug}>
          <MinimalTemplate className={`${baseClass}__modal-template`}>
            <h1>{t('general:confirmDuplication')}</h1>
            <p>{t('general:unsavedChangesDuplicate')}</p>
            <Button
              buttonStyle="secondary"
              id="confirm-cancel"
              onClick={() => toggleModal(modalSlug)}
              type="button"
            >
              {t('general:cancel')}
            </Button>
            <Button id="confirm-duplicate" onClick={confirm}>
              {t('general:duplicateWithoutSaving')}
            </Button>
          </MinimalTemplate>
        </Modal>
      )}
    </React.Fragment>
  )
}

export default Duplicate
