export type StepNavItem = {
  label: Record<string, string> | string
  url?: string
}

export type Context = {
  setStepNav: (items: StepNavItem[]) => void
  stepNav: StepNavItem[]
}
