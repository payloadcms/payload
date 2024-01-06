import { Permissions, User } from 'payload/auth'
import { SanitizedConfig } from 'payload/types'
import type React from 'react'

export type Props = {
  children?: React.ReactNode
  className?: string
  config: Promise<SanitizedConfig>
  user: User
  permissions: Permissions
  i18n: any
}
