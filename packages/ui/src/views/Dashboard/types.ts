import type { Permissions, User } from 'payload/auth'
import type { ClientConfig, SanitizedConfig } from 'payload/types'

export type Props = {
  config: SanitizedConfig
  clientConfig: ClientConfig
}
