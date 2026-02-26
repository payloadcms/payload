'use client'
import type { ClientFieldConfig } from 'payload'

import { useClientAdminConfig, useRscSchemaPaths } from './index.js'

export type AdminFieldConfigResult = {
  clientConfig?: ClientFieldConfig
  hasRscComponents: boolean
}

export const useAdminFieldConfig = (schemaPath: string | undefined): AdminFieldConfigResult => {
  const clientConfig = useClientAdminConfig()
  const rscPaths = useRscSchemaPaths()

  if (!schemaPath) {
    return { hasRscComponents: false }
  }

  return {
    clientConfig: clientConfig.fields?.[schemaPath],
    hasRscComponents: rscPaths.includes(schemaPath),
  }
}
