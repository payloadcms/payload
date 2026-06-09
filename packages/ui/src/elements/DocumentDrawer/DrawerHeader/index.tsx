'use client'

import type { ClientUser } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useModal } from '../../../elements/Modal/index.js'
import { RenderTitle } from '../../../elements/RenderTitle/index.js'
import { useFormModified } from '../../../forms/Form/index.js'
import { ChevronIcon } from '../../../icons/Chevron/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useDocumentInfo } from '../../../providers/DocumentInfo/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { formatTimeToNow } from '../../../utilities/formatDocTitle/formatDateTitle.js'
import { Button } from '../../Button/index.js'
import { LeaveWithoutSavingModal } from '../../LeaveWithoutSaving/index.js'
import { Locked } from '../../Locked/index.js'
import { documentDrawerBaseClass } from '../index.js'
import './index.css'

const leaveWithoutSavingModalSlug = 'leave-without-saving-doc-drawer'

export const DocumentDrawerHeader: React.FC<{
  actions?: React.ReactNode
  AfterHeader?: React.ReactNode
  BeforeDocumentMeta?: React.ReactNode
  drawerSlug: string
  readOnlyForIncomingUser?: boolean
  renderTitleAsLink?: boolean
  user?: ClientUser
}> = ({
  actions,
  AfterHeader,
  BeforeDocumentMeta,
  drawerSlug,
  readOnlyForIncomingUser,
  renderTitleAsLink = true,
  user,
}) => {
  const { closeModal, openModal } = useModal()
  const { i18n, t } = useTranslation()
  const { getEntityConfig } = useConfig()
  const isModified = useFormModified()
  const { id, collectionSlug, data, globalSlug } = useDocumentInfo()

  const collectionConfig = getEntityConfig({ collectionSlug })
  const globalConfig = getEntityConfig({ globalSlug })

  const singularLabel = getTranslation(
    collectionConfig?.labels?.singular ?? globalConfig?.label ?? t('general:document'),
    i18n,
  )

  const headerLabel = id
    ? `${t('general:editing')} ${singularLabel}`
    : t('general:creatingNewLabel', { label: singularLabel })

  const updatedAt = data?.updatedAt

  const [relativeTime, setRelativeTime] = useState<string>('')

  const i18nRef = useRef(i18n)
  i18nRef.current = i18n

  useEffect(() => {
    if (!updatedAt) {
      setRelativeTime('')
      return
    }

    const update = () =>
      setRelativeTime(formatTimeToNow({ date: updatedAt, i18n: i18nRef.current }))

    update()
    const interval = setInterval(update, 60000)
    return () => clearInterval(interval)
  }, [updatedAt])

  const handleOnClose = useCallback(() => {
    if (isModified) {
      openModal(leaveWithoutSavingModalSlug)
    } else {
      closeModal(drawerSlug)
    }
  }, [isModified, openModal, closeModal, drawerSlug])

  const showLockedMetaIcon = user && readOnlyForIncomingUser

  return (
    <div className={`${documentDrawerBaseClass}__header`}>
      <div className={`${documentDrawerBaseClass}__header-bar`}>
        <div className={`${documentDrawerBaseClass}__header-content`}>
          <Button
            aria-label={t('general:close')}
            buttonStyle="ghost"
            className={`${documentDrawerBaseClass}__header-close`}
            icon={<ChevronIcon direction="left" size={24} />}
            onClick={handleOnClose}
          />
          <span className={`${documentDrawerBaseClass}__header-text`}>{headerLabel}</span>
        </div>
        {actions ? (
          <div className={`${documentDrawerBaseClass}__header-actions`}>{actions}</div>
        ) : null}
      </div>

      <div className={`${documentDrawerBaseClass}__title-bar`}>
        <RenderTitle
          className={`${documentDrawerBaseClass}__title`}
          element="h2"
          renderAsLink={renderTitleAsLink}
        />
        <div className={`${documentDrawerBaseClass}__meta`}>
          {Boolean(showLockedMetaIcon || BeforeDocumentMeta) && (
            <div className={`${documentDrawerBaseClass}__before-meta`}>
              {showLockedMetaIcon && (
                <Locked className={`${documentDrawerBaseClass}__locked-controls`} user={user} />
              )}
              {BeforeDocumentMeta}
            </div>
          )}
          {relativeTime ? (
            <span className={`${documentDrawerBaseClass}__updated-at`}>
              {t('general:updatedAgo', { distance: relativeTime })}
            </span>
          ) : null}
        </div>
        {AfterHeader ? (
          <div className={`${documentDrawerBaseClass}__after-header`}>{AfterHeader}</div>
        ) : null}
      </div>

      <LeaveWithoutSavingModal
        modalSlug={leaveWithoutSavingModalSlug}
        onConfirm={() => closeModal(drawerSlug)}
      />
    </div>
  )
}
