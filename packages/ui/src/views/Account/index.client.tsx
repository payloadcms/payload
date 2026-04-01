'use client'
import React from 'react'

import { type StepNavItem, useStepNav } from '../../elements/StepNav/index.js'
import { useTranslation } from '../../providers/Translation/index.js'

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
