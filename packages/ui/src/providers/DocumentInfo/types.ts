import type React from 'react'

import type { SanitizedCollectionConfig, SanitizedGlobalConfig } from 'payload/types'

export type Props = {
  children?: React.ReactNode
  collectionSlug?: SanitizedCollectionConfig['slug']
  globalSlug?: SanitizedGlobalConfig['slug']
  id?: number | string
  idFromParams?: boolean
  versionsConfig?: SanitizedCollectionConfig['versions'] | SanitizedGlobalConfig['versions']
}
