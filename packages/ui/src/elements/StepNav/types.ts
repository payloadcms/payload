import type { LabelFunction, StaticLabel } from 'payload'
import type React from 'react'

export type StepNavItem = {
  forceReload?: boolean
  /** Whether this item represents the current page. Defaults to true for the last item. */
  isCurrent?: boolean
  label: LabelFunction | React.JSX.Element | StaticLabel
  url?: string
}

export type ContextType = {
  setStepNav: (items: StepNavItem[]) => void
  stepNav: StepNavItem[]
}
