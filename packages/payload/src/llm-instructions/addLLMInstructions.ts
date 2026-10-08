import type { SanitizedConfig } from '../config/types.js'

import { getInstructionsCollection } from './getInstructionsCollection.js'
import { instructionsCollectionSlug } from './shared.js'

export const addLLMInstructions = ({ config }: { config: SanitizedConfig }) => {
  const menuItem = '@payloadcms/ui#LLMInstructionsMenuItem'

  for (const collection of config.collections) {
    if (collection.admin.hidden === true || collection.slug === instructionsCollectionSlug) {
      continue
    }

    collection.admin.components ??= {}
    collection.admin.components.listMenuItems = [
      ...(collection.admin.components.listMenuItems ?? []).filter((item) => item !== menuItem),
      menuItem,
    ]
  }

  for (const global of config.globals) {
    if (global.admin.hidden === true) {
      continue
    }

    global.admin.components ??= {}
    global.admin.components.edit ??= {}
    global.admin.components.edit.editMenuItems = [
      ...(global.admin.components.edit.editMenuItems ?? []).filter((item) => item !== menuItem),
      menuItem,
    ]
  }

  return getInstructionsCollection({ config })
}
