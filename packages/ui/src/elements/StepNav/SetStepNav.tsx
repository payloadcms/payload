'use client'
import { useEffect } from 'react'

import type { StepNavItem } from './types.js'

import { useStepNav } from './context.js'

export const SetStepNav: React.FC<{
  nav: StepNavItem[]
}> = ({ nav }) => {
  const { setStepNav } = useStepNav()

  useEffect(() => {
    setStepNav(nav)
  }, [setStepNav, nav])

  return null
}
