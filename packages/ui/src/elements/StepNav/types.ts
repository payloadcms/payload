import type { LabelFunction, StaticLabel } from 'payload'
import type React from 'react'

import type { HierarchyDropData } from '../../providers/HierarchyDnd/types.js'

export type StepNavItem = {
  /**
   * Makes this crumb a hierarchy drop target, so a drag can move documents to an ancestor folder or
   * to root by dropping on the trail.
   */
  dropTarget?: HierarchyDropData
  forceReload?: boolean
  label: LabelFunction | React.JSX.Element | StaticLabel
  url?: string
}

export type ContextType = {
  setStepNav: (items: StepNavItem[]) => void
  stepNav: StepNavItem[]
}
