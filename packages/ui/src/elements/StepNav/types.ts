import type { LabelFunction, StaticLabel } from 'payload'
import type React from 'react'

export type StepNavItem = {
  label: LabelFunction | React.JSX.Element | StaticLabel
  replace?: boolean
  url?: string
}

export type ContextType = {
  setStepNav: (items: StepNavItem[]) => void
  stepNav: StepNavItem[]
}
