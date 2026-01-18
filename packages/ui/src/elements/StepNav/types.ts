import type { LabelFunction, StaticLabel } from '@ruya.sa/payload'
import type React from 'react'

export type StepNavItem = {
  label: LabelFunction | React.JSX.Element | StaticLabel
  url?: string
}

export type ContextType = {
  setStepNav: (items: StepNavItem[]) => void
  stepNav: StepNavItem[]
}
