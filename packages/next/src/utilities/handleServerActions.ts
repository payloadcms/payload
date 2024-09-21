import type { Action } from 'payload'

import type { RenderConfigArgs } from './renderConfig.js'

import { renderConfig } from './renderConfig.js'

export const handleServerActions = async (action: Action.RenderConfig, args: RenderConfigArgs) => {
  switch (action) {
    case 'render-config': {
      return renderConfig(args)
    }

    default: {
      console.error(`Unknown Server Action: ${action as string}`) // eslint-disable-line no-console
    }
  }
}
