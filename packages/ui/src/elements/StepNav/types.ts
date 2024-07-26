import type { LabelFunction, LabelStatic } from 'payload'

export type StepNavItem = {
  label: LabelFunction | LabelStatic
  url?: string
}

export type ContextType = {
  setStepNav: (items: StepNavItem[]) => void
  stepNav: StepNavItem[]
}
