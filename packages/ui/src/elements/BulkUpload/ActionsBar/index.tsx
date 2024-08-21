'use client'

import React from 'react'

import { ChevronIcon } from '../../../icons/Chevron/index.js'
import { useDocumentInfo } from '../../../providers/DocumentInfo/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Button } from '../../Button/index.js'
import { useFormsManager } from '../FormsManager/index.js'
import { strings } from '../strings.js'
import './index.scss'

const baseClass = 'bulk-upload--actions-bar'

export function ActionsBar() {
  const {
    activeIndex,
    forms,
    hasPublishPermission,
    hasSavePermission,
    saveAllDocs,
    setActiveIndex,
  } = useFormsManager()
  const { docConfig } = useDocumentInfo()
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
            aria-label={strings.previous}
            buttonStyle="none"
            onClick={() => {
              const nextIndex = activeIndex - 1
              if (nextIndex < 0) setActiveIndex(forms.length - 1)
              else setActiveIndex(nextIndex)
            }}
            type="button"
          >
            <ChevronIcon direction="left" />
          </Button>
          <Button
            aria-label={strings.next}
            buttonStyle="none"
            onClick={() => {
              const nextIndex = activeIndex + 1
              if (nextIndex === forms.length) setActiveIndex(0)
              else setActiveIndex(nextIndex)
            }}
            type="button"
          >
            <ChevronIcon direction="right" />
          </Button>
        </div>
      </div>

      <div className={`${baseClass}__buttons`}>
        {docConfig?.versions?.drafts && hasSavePermission ? (
          <Button
            buttonStyle="secondary"
            onClick={() => void saveAllDocs({ overrides: { _status: 'draft' } })}
          >
            {t('version:saveDraft')}
          </Button>
        ) : null}
        {docConfig?.versions?.drafts && hasPublishPermission ? (
          <Button onClick={() => void saveAllDocs({ overrides: { _status: 'published' } })}>
            {t('version:publish')}
          </Button>
        ) : null}

        {!docConfig?.versions?.drafts && hasSavePermission ? (
          <Button onClick={() => void saveAllDocs()}>{t('general:save')}</Button>
        ) : null}
      </div>
    </div>
  )
}
