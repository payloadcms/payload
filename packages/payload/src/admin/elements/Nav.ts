export type NavPreferences = {
  groups: NavGroupPreferences
  open: boolean
}

export type NavGroupPreferences = {
  [key: string]: {
    open: boolean
  }
}
