import type { Permissions, User } from 'payload/auth'
import type { SanitizedConfig } from 'payload/types'
import type React from 'react'

export type Props = {
  children?: React.ReactNode
  className?: string
  config: Promise<SanitizedConfig> | SanitizedConfig
  i18n: any
  permissions: Permissions
  user: User
}
