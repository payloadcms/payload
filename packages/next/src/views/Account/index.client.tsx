'use client'
import { type StepNavItem, useStepNav, useTranslation } from '@payloadcms/ui'
import React from 'react'

export const AccountClient: React.FC = () => {
  const { setStepNav } = useStepNav()
  const { t } = useTranslation()

  React.useEffect(() => {
    const nav: StepNavItem[] = []

    nav.push({
      label: t('authentication:account'),
      url: '/account',
    })

    setStepNav(nav)
  }, [setStepNav, t])

  return null
}
