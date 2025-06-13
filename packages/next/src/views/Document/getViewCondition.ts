import type {
  Data,
  PayloadRequest,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
} from 'payload'

import { getViewConfig } from '../../elements/DocumentHeader/Tabs/getViewConfig.js'

export const getViewCondition = (args: {
  collectionConfig: SanitizedCollectionConfig
  doc: Data
  globalConfig: SanitizedGlobalConfig
  name: string
  req: PayloadRequest
}): boolean => {
  const { name, collectionConfig, doc, globalConfig, req } = args

  const viewConfig = getViewConfig({ name, collectionConfig, globalConfig })

  const { condition } = viewConfig || {}

  const meetsCondition = !condition || (condition && Boolean(condition({ doc, req })))

  return meetsCondition
}
