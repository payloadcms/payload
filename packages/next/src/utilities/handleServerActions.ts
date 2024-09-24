import type { AcceptedLanguages } from '@payloadcms/translations'
import type { ImportMap, SanitizedConfig } from 'payload'

import { renderConfig } from './renderConfig.js'

export const handleServerActions = async (
  action: string,
  args: {
    config: Promise<SanitizedConfig> | SanitizedConfig
    importMap: ImportMap
    languageCode: AcceptedLanguages
  },
): Promise<unknown> => {
  switch (action) {
    case 'render-config': {
      // @ts-expect-error eslint-disable-next-line
      return renderConfig(args)
    }

    default: {
      console.error(`Unknown Server Action: ${action}`) // eslint-disable-line no-console
    }
  }
}
