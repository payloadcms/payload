import type { StaticLabel } from '../../config/types.js'
import type { ClientUser, Locale, PayloadRequest, ServerProps } from '../../index.js'

export enum EntityType {
  collection = 'collections',
  global = 'globals',
}

export type NavGroupType = {
  entities: {
    label: StaticLabel
    slug: string
    type: EntityType
  }[]
  label: string
}

export type DashboardViewClientProps = {
  locale: Locale
}

export type DashboardViewServerPropsOnly = {
  globalData: Array<{
    data: { _isLocked: boolean; _lastEditedAt: string; _userEditing: ClientUser | number | string }
    lockDuration?: number
    slug: string
  }>
  navGroups?: NavGroupType[]
  req: PayloadRequest
} & ServerProps

export type DashboardViewServerProps = DashboardViewClientProps & DashboardViewServerPropsOnly
