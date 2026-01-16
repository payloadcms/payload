export type NavPreferences = {
  activeTab?: string
  groups: NavGroupPreferences
  open: boolean
}

export type NavGroupPreferences = {
  [key: string]: {
    open: boolean
  }
}
