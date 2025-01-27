'use client'

import type { ClientCollectionConfig, SanitizedCollectionConfig } from 'payload'

import { Modal, useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import { useRouter } from 'next/navigation.js'
import React, { useCallback, useState } from 'react'
import { toast } from 'sonner'

import type { DocumentDrawerContextType } from '../DocumentDrawer/Provider.js'

import { useForm, useFormModified } from '../../forms/Form/context.js'
import { useConfig } from '../../providers/Config/index.js'
import { useEditDepth } from '../../providers/EditDepth/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { requests } from '../../utilities/api.js'
import { formatAdminURL } from '../../utilities/formatAdminURL.js'
import { Button } from '../Button/index.js'
import { drawerZBase } from '../Drawer/index.js'
import { PopupList } from '../Popup/index.js'
import './index.scss'

const baseClass = 'duplicate'

export type Props = {
  readonly id: string
  readonly onDuplicate?: DocumentDrawerContextType['onDuplicate']
  readonly redirectAfterDuplicate?: boolean
  readonly singularLabel: SanitizedCollectionConfig['labels']['singular']
  readonly slug: string
}

export const DuplicateDocument: React.FC<Props> = ({
  id,
  slug,
  onDuplicate,
  redirectAfterDuplicate = true,
  singularLabel,
}) => {
  const router = useRouter()
  const modified = useFormModified()
  const { toggleModal } = useModal()
  const locale = useLocale()
  const { setModified } = useForm()

  const {
    config: {
      routes: { admin: adminRoute, api: apiRoute },
      serverURL,
    },
    getEntityConfig,
  } = useConfig()

  const collectionConfig = getEntityConfig({ collectionSlug: slug })

  const [hasClicked, setHasClicked] = useState<boolean>(false)
  const { i18n, t } = useTranslation()

  const modalSlug = `duplicate-${id}`

  const editDepth = useEditDepth()

  const handleClick = useCallback(
    async (override = false) => {
      setHasClicked(true)

      if (modified && !override) {
        toggleModal(modalSlug)
        return
      }
      await requests
        .post(
          `${serverURL}${apiRoute}/${slug}/${id}/duplicate${locale?.code ? `?locale=${locale.code}` : ''}`,
          {
            body: JSON.stringify({}),
            headers: {
              'Accept-Language': i18n.language,
              'Content-Type': 'application/json',
              credentials: 'include',
            },
          },
        )
        .then(async (res) => {
          const { doc, errors, message } = await res.json()
          if (res.status < 400) {
            toast.success(
              message ||
                t('general:successfullyDuplicated', { label: getTranslation(singularLabel, i18n) }),
            )

            setModified(false)

            if (redirectAfterDuplicate) {
              router.push(
                formatAdminURL({
                  adminRoute,
                  path: `/collections/${slug}/${doc.id}${locale?.code ? `?locale=${locale.code}` : ''}`,
                }),
              )
            }

            if (typeof onDuplicate === 'function') {
              void onDuplicate({ collectionConfig, doc })
            }
          } else {
            toast.error(
              errors?.[0].message ||
                message ||
                t('error:unspecific', { label: getTranslation(singularLabel, i18n) }),
            )
          }
        })
    },
    [
      locale,
      modified,
      serverURL,
      apiRoute,
      slug,
      id,
      i18n,
      toggleModal,
      modalSlug,
      t,
      singularLabel,
      onDuplicate,
      redirectAfterDuplicate,
      setModified,
      router,
      adminRoute,
      collectionConfig,
    ],
  )

  const confirm = useCallback(async () => {
    setHasClicked(false)
    await handleClick(true)
  }, [handleClick])

  return (
    <React.Fragment>
      <PopupList.Button id="action-duplicate" onClick={() => void handleClick(false)}>
        {t('general:duplicate')}
      </PopupList.Button>
      {modified && hasClicked && (
        <Modal
          className={`${baseClass}__modal`}
          slug={modalSlug}
          style={{
            zIndex: drawerZBase + editDepth,
          }}
        >
          <div className={`${baseClass}__wrapper`}>
            <div className={`${baseClass}__content`}>
              <h1>{t('general:confirmDuplication')}</h1>
              <p>{t('general:unsavedChangesDuplicate')}</p>
            </div>
            <div className={`${baseClass}__controls`}>
              <Button
                buttonStyle="secondary"
                id="confirm-cancel"
                onClick={() => toggleModal(modalSlug)}
                size="large"
                type="button"
              >
                {t('general:cancel')}
              </Button>
              <Button id="confirm-duplicate" onClick={() => void confirm()} size="large">
                {t('general:duplicateWithoutSaving')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </React.Fragment>
  )
}
