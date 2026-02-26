'use client'
import type { ClientFieldConfig, RscFieldComponentConfig } from 'payload'

import { useClientAdminConfig, useRscAdminConfig } from './index.js'

export type MergedFieldConfig = {
  clientConfig?: ClientFieldConfig
  rscOverrides?: RscFieldComponentConfig
}

export const useAdminFieldConfig = (schemaPath: string | undefined): MergedFieldConfig => {
  const clientConfig = useClientAdminConfig()
  const rscConfig = useRscAdminConfig()

  if (!schemaPath) {
    return {}
  }

  return {
    clientConfig: clientConfig.fields?.[schemaPath],
    rscOverrides: rscConfig.fields?.[schemaPath]?.components,
  }
}
