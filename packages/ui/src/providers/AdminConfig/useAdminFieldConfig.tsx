'use client'
import type { ClientFieldConfig, RscFieldComponentConfig } from 'payload'

import { useClientAdminConfig, useRscOverrides } from './index.js'

export type MergedFieldConfig = {
  clientConfig?: ClientFieldConfig
  rscOverrides?: RscFieldComponentConfig
}

export const useAdminFieldConfig = (schemaPath: string | undefined): MergedFieldConfig => {
  const clientConfig = useClientAdminConfig()
  const rscOverrides = useRscOverrides()

  if (!schemaPath) {
    return {}
  }

  return {
    clientConfig: clientConfig[schemaPath],
    rscOverrides: rscOverrides[schemaPath]?.components,
  }
}
