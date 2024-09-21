import type { Action, ImportMap, SanitizedConfig } from 'payload'

import { renderConfig } from './renderConfig.js'

export const handleServerActions = async (
  action: Action,
  args: {
    [key: string]: any
    config: Promise<SanitizedConfig> | SanitizedConfig
    importMap: ImportMap
  },
) => {
  switch (action) {
    case 'render-config': {
      return renderConfig(args)
    }

    default: {
      console.error(`Unknown Server Action: ${action as string}`) // eslint-disable-line no-console
    }
  }
}
