'use client'

import { useAuth, useForm, useTranslation } from '@payloadcms/ui'
import React from 'react'

export const TestButton: React.FC = () => {
  const { refreshPermissions } = useAuth()
  const { submit } = useForm()
  const { t } = useTranslation()
  const label = t('general:save')

  return (
    <button
      id="action-save"
      onClick={(e) => {
        e.preventDefault()

        void refreshPermissions()
        void submit()
      }}
      type="submit"
    >
      Custom: {label}
    </button>
  )
}
