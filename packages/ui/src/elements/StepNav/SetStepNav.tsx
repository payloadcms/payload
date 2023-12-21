'use client'
import { useEffect } from 'react'
import { useStepNav } from '.'
import { StepNavItem } from './types'

export const SetStepNav: React.FC<{
  nav: StepNavItem[]
}> = ({ nav }) => {
  const { setStepNav } = useStepNav()

  useEffect(() => {
    setStepNav(nav)
  }, [setStepNav, nav])

  return null
}
