'use client'

import React from 'react'

import { useFormInitializing, useFormProcessing } from '../../forms/Form/context.js'
import { useDocumentValidation } from '../../providers/DocumentValidation/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'

export const ValidateDocumentButton: React.FC = () => {
  const initializing = useFormInitializing()
  const processing = useFormProcessing()
  const { isValidating, validateAllLocales } = useDocumentValidation()
  const { t } = useTranslation()

  return (
    <Button
      buttonStyle="secondary"
      disabled={initializing || processing}
      id="action-validate-all-locales"
      loading={isValidating}
      onClick={() => void validateAllLocales()}
      size="medium"
    >
      {t('validation:validateAllLocales')}
    </Button>
  )
}
