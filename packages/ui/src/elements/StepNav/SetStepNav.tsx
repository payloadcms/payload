'use client'
import { useEffect } from 'react'

import type { StepNavItem } from './index.js'

import { useStepNav } from './index.js'

export const SetStepNav: React.FC<{
  nav: StepNavItem[]
}> = ({ nav }) => {
  const { setStepNav } = useStepNav()

  useEffect(() => {
    setStepNav(nav)
  }, [setStepNav, nav])

  return null
}
