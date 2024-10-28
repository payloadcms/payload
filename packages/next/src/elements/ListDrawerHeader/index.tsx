'use client'
import type { StaticDescription, StaticLabel } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import {
  FieldLabel,
  Pill,
  ReactSelect,
  useModal,
  useTranslation,
  ViewDescription,
  XIcon,
} from '@payloadcms/ui'
import React from 'react'

import './index.scss'

const baseClass = 'list-drawer'

export const ListDrawerHeader: React.FC<{
  CustomDescription?: React.ReactNode
  customHeader?: string
  description?: StaticDescription
  drawerSlug: string
  hasCreatePermission: boolean
  pluralLabel: StaticLabel
}> = ({
  CustomDescription,
  customHeader,
  description,
  drawerSlug,
  hasCreatePermission,
  pluralLabel,
}) => {
  const { i18n, t } = useTranslation()
  const { closeModal } = useModal()

  return (
    <header className={`${baseClass}__header`}>
      <div className={`${baseClass}__header-wrap`}>
        <div className={`${baseClass}__header-content`}>
          <h2 className={`${baseClass}__header-text`}>
            {!customHeader ? getTranslation(pluralLabel, i18n) : customHeader}
          </h2>
          {hasCreatePermission && (
            <button
              className={`${baseClass}__create-new-button`}
              onClick={() => closeModal(drawerSlug)}
              type="button"
            >
              <Pill>{t('general:createNew')}</Pill>
            </button>
          )}
        </div>
        <button
          aria-label={t('general:close')}
          className={`${baseClass}__header-close`}
          onClick={() => {
            closeModal(drawerSlug)
          }}
          type="button"
        >
          <XIcon />
        </button>
      </div>
      {description || CustomDescription ? (
        <div className={`${baseClass}__sub-header`}>
          {CustomDescription ?? <ViewDescription description={description} />}
        </div>
      ) : null}
      {/* {moreThanOneAvailableCollection && (
        <div className={`${baseClass}__select-collection-wrap`}>
          <FieldLabel label={t('upload:selectCollectionToBrowse')} />
          <ReactSelect
            className={`${baseClass}__select-collection`}
            onChange={setSelectedOption} // this is only changing the options which is not rerunning my effect
            options={enabledCollectionConfigs.map((coll) => ({
              label: getTranslation(coll.labels.singular, i18n),
              value: coll.slug,
            }))}
            value={selectedOption}
          />
        </div>
      )} */}
    </header>
  )
}
