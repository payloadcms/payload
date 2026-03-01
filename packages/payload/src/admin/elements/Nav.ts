import type { ServerProps } from '../../config/types.js'
import type { DocumentSubViewTypes } from '../views/document.js'
import type { ViewTypes } from '../views/index.js'

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

export type SidebarTabClientProps = {
  documentSubViewType?: DocumentSubViewTypes
  viewType?: ViewTypes
}

export type SidebarTabServerPropsOnly = {} & ServerProps

export type SidebarTabServerProps = SidebarTabClientProps & SidebarTabServerPropsOnly
