import type { RscAdminConfig } from 'payload'

import { cache } from 'react'

const getAdminConfigCache = cache((): { config: RscAdminConfig } => {
  return { config: {} }
})

export function setAdminConfig(config: RscAdminConfig): void {
  getAdminConfigCache().config = config
}

export function getAdminConfig(): RscAdminConfig {
  return getAdminConfigCache().config
}
