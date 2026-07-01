'use client'

import type { ClientUser } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { hasAutosaveEnabled, hasDraftsEnabled } from 'payload/shared'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useModal } from '../../../elements/Modal/index.js'
import { RenderTitle } from '../../../elements/RenderTitle/index.js'
import { useFormModified } from '../../../forms/Form/index.js'
import { ChevronIcon } from '../../../icons/Chevron/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useDocumentInfo } from '../../../providers/DocumentInfo/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { formatDate, formatTimeToNow } from '../../../utilities/formatDocTitle/formatDateTitle.js'
import { Autosave } from '../../Autosave/index.js'
import { Button } from '../../Button/index.js'
import { LeaveWithoutSavingModal } from '../../LeaveWithoutSaving/index.js'
import { Locked } from '../../Locked/index.js'
import { RenderCustomComponent } from '../../RenderCustomComponent/index.js'
import { Status } from '../../Status/index.js'
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
  Status?: React.ReactNode
  user?: ClientUser
}> = ({
  actions,
  AfterHeader,
  BeforeDocumentMeta,
  drawerSlug,
  readOnlyForIncomingUser,
  renderTitleAsLink = true,
  Status: CustomStatus,
  user,
}) => {
  const { closeModal, openModal } = useModal()
  const { i18n, t } = useTranslation()
  const { config, getEntityConfig } = useConfig()
  const isModified = useFormModified()
  const { id, collectionSlug, data, globalSlug, hasSavePermission, isEditing, isTrashed } =
    useDocumentInfo()

  const collectionConfig = getEntityConfig({ collectionSlug })
  const globalConfig = getEntityConfig({ globalSlug })

  const collectionHasDraftsEnabled = hasDraftsEnabled(collectionConfig)
  const globalHasDraftsEnabled = hasDraftsEnabled(globalConfig)
  const autosaveEnabled = hasAutosaveEnabled(collectionConfig) || hasAutosaveEnabled(globalConfig)

  const unsavedDraftWithValidations =
    !id && collectionConfig?.versions?.drafts && collectionConfig.versions?.drafts.validate

  const showStatus =
    (collectionHasDraftsEnabled || globalHasDraftsEnabled) &&
    (Boolean(globalConfig) || (Boolean(collectionConfig) && isEditing))

  const showAutosave =
    (collectionHasDraftsEnabled || globalHasDraftsEnabled) &&
    hasSavePermission &&
    autosaveEnabled &&
    !unsavedDraftWithValidations &&
    !isTrashed

  const singularLabel = getTranslation(
    collectionConfig?.labels?.singular ?? globalConfig?.label ?? t('general:document'),
    i18n,
  )

  const headerLabel = id
    ? `${t('general:editing')} ${singularLabel}`
    : t('general:creatingNewLabel', { label: singularLabel })

  const updatedAt = data?.updatedAt
  const createdAt = data?.createdAt

  const {
    admin: { dateFormat },
  } = config

  const [relativeTime, setRelativeTime] = useState<string>('')
  const [formattedUpdatedAt, setFormattedUpdatedAt] = useState<string>('')
  const [formattedCreatedAt, setFormattedCreatedAt] = useState<string>('')

  const i18nRef = useRef(i18n)
  i18nRef.current = i18n

  useEffect(() => {
    const date = updatedAt || createdAt

    if (!date) {
      setRelativeTime('')
      return
    }

    const update = () => setRelativeTime(formatTimeToNow({ date, i18n: i18nRef.current }))

    update()
    const interval = setInterval(update, 60000)
    return () => clearInterval(interval)
  }, [updatedAt, createdAt])

  useEffect(() => {
    if (updatedAt) {
      setFormattedUpdatedAt(formatDate({ date: updatedAt, i18n, pattern: dateFormat }))
    }
    if (createdAt) {
      setFormattedCreatedAt(formatDate({ date: createdAt, i18n, pattern: dateFormat }))
    }
  }, [updatedAt, createdAt, i18n, dateFormat])

  const showUpdatedAt = Boolean(
    collectionConfig?.timestamps && isEditing && (updatedAt || createdAt),
  )

  const handleOnClose = useCallback(() => {
    if (isModified) {
      openModal(leaveWithoutSavingModalSlug)
    } else {
      closeModal(drawerSlug)
    }
  }, [isModified, openModal, closeModal, drawerSlug])

  const showLockedMetaIcon = user && readOnlyForIncomingUser

  const showBeforeMeta = Boolean(showLockedMetaIcon || BeforeDocumentMeta)
  const showMeta = showBeforeMeta || showStatus || showUpdatedAt || showAutosave

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
        {showMeta ? (
          <div className={`${documentDrawerBaseClass}__meta`}>
            {showBeforeMeta && (
              <div className={`${documentDrawerBaseClass}__before-meta`}>
                {showLockedMetaIcon && (
                  <Locked className={`${documentDrawerBaseClass}__locked-controls`} user={user} />
                )}
                {BeforeDocumentMeta}
              </div>
            )}
            {showStatus ? (
              <RenderCustomComponent CustomComponent={CustomStatus} Fallback={<Status />} />
            ) : null}
            {showUpdatedAt ? (
              <span
                className={`${documentDrawerBaseClass}__updated-at`}
                title={formattedUpdatedAt || formattedCreatedAt || undefined}
              >
                {relativeTime
                  ? t(isTrashed ? 'general:deletedAgo' : 'general:updatedAgo', {
                      distance: relativeTime,
                    })
                  : `${t('general:loading')}...`}
              </span>
            ) : null}
            {showAutosave ? (
              <Autosave
                collection={collectionConfig}
                global={globalConfig}
                id={id}
                publishedDocUpdatedAt={data?.createdAt}
              />
            ) : null}
          </div>
        ) : null}
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
