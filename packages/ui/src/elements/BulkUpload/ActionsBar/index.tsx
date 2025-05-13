'use client'

import type { ClientCollectionConfig } from 'payload'

import React from 'react'

import { ChevronIcon } from '../../../icons/Chevron/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Button } from '../../Button/index.js'
import { EditManyBulkUploads } from '../EditMany/index.js'
import { useFormsManager } from '../FormsManager/index.js'
import './index.scss'

const baseClass = 'bulk-upload--actions-bar'

type Props = {
  readonly collectionConfig: ClientCollectionConfig
}

export function ActionsBar({ collectionConfig }: Props) {
  const { activeIndex, forms, setActiveIndex } = useFormsManager()
  const { t } = useTranslation()

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__navigation`}>
        <p className={`${baseClass}__locationText`}>
          <strong>{activeIndex + 1}</strong>
          {' of '}
          <strong>{forms.length}</strong>
        </p>

        <div className={`${baseClass}__controls`}>
          <Button
            aria-label={t('general:previous')}
            buttonStyle="none"
            onClick={() => {
              const nextIndex = activeIndex - 1
              if (nextIndex < 0) {
                setActiveIndex(forms.length - 1)
              } else {
                setActiveIndex(nextIndex)
              }
            }}
            type="button"
          >
            <ChevronIcon direction="left" />
          </Button>
          <Button
            aria-label={t('general:next')}
            buttonStyle="none"
            onClick={() => {
              const nextIndex = activeIndex + 1
              if (nextIndex === forms.length) {
                setActiveIndex(0)
              } else {
                setActiveIndex(nextIndex)
              }
            }}
            type="button"
          >
            <ChevronIcon direction="right" />
          </Button>
        </div>
        <EditManyBulkUploads collection={collectionConfig} />
      </div>

      <Actions className={`${baseClass}__saveButtons`} />
    </div>
  )
}

type ActionsProps = {
  readonly className?: string
}
export function Actions({ className }: ActionsProps) {
  const { getEntityConfig } = useConfig()
  const { t } = useTranslation()
  const { collectionSlug, hasPublishPermission, hasSavePermission, saveAllDocs } = useFormsManager()

  const collectionConfig = getEntityConfig({ collectionSlug })

  return (
    <div className={[`${baseClass}__buttons`, className].filter(Boolean).join(' ')}>
      {collectionConfig?.versions?.drafts && hasSavePermission ? (
        <Button
          buttonStyle="secondary"
          onClick={() => void saveAllDocs({ overrides: { _status: 'draft' } })}
        >
          {t('version:saveDraft')}
        </Button>
      ) : null}
      {collectionConfig?.versions?.drafts && hasPublishPermission ? (
        <Button onClick={() => void saveAllDocs({ overrides: { _status: 'published' } })}>
          {t('version:publish')}
        </Button>
      ) : null}

      {!collectionConfig?.versions?.drafts && hasSavePermission ? (
        <Button onClick={() => void saveAllDocs()}>{t('general:save')}</Button>
      ) : null}
    </div>
  )
}
