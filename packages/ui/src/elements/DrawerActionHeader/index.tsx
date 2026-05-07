'use client'

import React from 'react'

import { FormSubmit } from '../../forms/Submit/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import './index.scss'

const baseClass = 'drawer-action-header'

type DrawerActionHeaderArgs = {
  readonly cancelLabel?: string
  className?: string
  readonly onCancel?: () => void
  readonly onSave?: () => void
  readonly saveLabel?: string
  readonly title: React.ReactNode | string
}
export const DrawerActionHeader = ({
  cancelLabel,
  className,
  onCancel,
  onSave,
  saveLabel,
  title,
}: DrawerActionHeaderArgs) => {
  const { t } = useTranslation()

  return (
    <div className={[baseClass, className].filter(Boolean).join(' ')}>
      <div className={`${baseClass}__content`}>
        <h1 className={`${baseClass}__title`}>{title}</h1>

        <div className={`${baseClass}__actions`}>
          <Button
            aria-label={t('general:cancel')}
            buttonStyle="secondary"
            margin={false}
            onClick={onCancel}
          >
            {cancelLabel || t('general:cancel')}
          </Button>

          <FormSubmit aria-label={t('general:applyChanges')} margin={false} onClick={onSave}>
            {saveLabel || t('general:applyChanges')}
          </FormSubmit>
        </div>
      </div>
    </div>
  )
}
