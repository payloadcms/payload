export type StepNavItem = {
  label: string
  url?: string
}

export type Context = {
  stepNav: StepNavItem[]
  setStepNav: (items: StepNavItem[]) => void
}
