'use client'
import type { FieldConfig } from 'payload'

import { useAdminConfig } from './index.js'

export const useAdminFieldConfig = (schemaPath: string | undefined): FieldConfig | undefined => {
  const adminConfig = useAdminConfig()

  if (!schemaPath) {
    return undefined
  }

  return adminConfig.fields?.[schemaPath]
}
