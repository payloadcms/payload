import type { RscAdminConfig } from 'payload'

let adminConfig: RscAdminConfig = {}

export function setAdminConfig(config: RscAdminConfig): void {
  adminConfig = config
}

export function getAdminConfig(): RscAdminConfig {
  return adminConfig
}
