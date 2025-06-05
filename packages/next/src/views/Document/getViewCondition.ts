import type {
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
  TypedUser,
} from 'payload'

import { getViewConfig } from '../../elements/DocumentHeader/Tabs/getViewConfig.js'

export const getViewCondition = (args: {
  collectionConfig: SanitizedCollectionConfig
  config: SanitizedConfig
  globalConfig: SanitizedGlobalConfig
  name: string
  user: TypedUser
}): boolean => {
  const { name, collectionConfig, config, globalConfig, user } = args

  const viewConfig = getViewConfig({ name, collectionConfig, globalConfig })

  const { condition } = viewConfig || {}

  const meetsCondition =
    !condition ||
    (condition &&
      Boolean(condition({ collectionConfig, config, globalConfig, permissions: {}, user })))

  if (meetsCondition) {
    return true
  }

  return false
}
