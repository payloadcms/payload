'use client'

import React from 'react'

import { FormSubmit } from '../../forms/Submit/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import './index.scss'

const baseClass = 'drawerHeader'

type DrawerActionHeaderArgs = {
  readonly cancelLabel?: string
  readonly onCancel?: () => void
  readonly onSave?: () => void
  readonly saveLabel?: string
  readonly title: React.ReactNode | string
}
export const DrawerActionHeader = ({
  cancelLabel,
  onCancel,
  onSave,
  saveLabel,
  title,
}: DrawerActionHeaderArgs) => {
  const { t } = useTranslation()

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__content`}>
        <h1 className={`${baseClass}__title`}>{title}</h1>

        <div className={`${baseClass}__actions`}>
          <Button aria-label={t('general:cancel')} buttonStyle="secondary" onClick={onCancel}>
            {cancelLabel || t('general:cancel')}
          </Button>

          <FormSubmit aria-label={t('general:applyChanges')} onClick={onSave}>
            {saveLabel || t('general:applyChanges')}
          </FormSubmit>
        </div>
      </div>
    </div>
  )
}
