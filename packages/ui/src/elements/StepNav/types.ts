import type { LabelFunction, StaticLabel } from 'payload'

export type StepNavItem = {
  label: LabelFunction | StaticLabel
  query?: string
  url?: string
}

export type ContextType = {
  setStepNav: (items: StepNavItem[]) => void
  stepNav: StepNavItem[]
}
