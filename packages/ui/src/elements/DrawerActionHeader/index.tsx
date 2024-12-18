'use client'

import React from 'react'

import { FormSubmit } from '../../forms/Submit/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import './index.scss'

const baseClass = 'drawerHeader'

type DrawerActionHeaderArgs = {
  readonly onCancel?: () => void
  readonly onSave?: () => void
  readonly title: string
}
export const DrawerActionHeader = ({ onCancel, onSave, title }: DrawerActionHeaderArgs) => {
  const { t } = useTranslation()

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__content`}>
        <h1 className={`${baseClass}__title`}>{title}</h1>

        <div className={`${baseClass}__actions`}>
          <Button aria-label={t('general:cancel')} buttonStyle="secondary" onClick={onCancel}>
            {t('general:cancel')}
          </Button>

          <FormSubmit aria-label={t('general:applyChanges')} onClick={onSave}>
            {t('general:applyChanges')}
          </FormSubmit>
        </div>
      </div>
    </div>
  )
}
