import type { AcceptedLanguages, GenericTranslationsObject } from '@payloadcms/translations'

import { translations } from '@payloadcms/translations/all'
import { enTranslations } from '@payloadcms/translations/languages/en'
import path from 'path'
import { fileURLToPath } from 'url'

import { translateObject } from './utils/index.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const allTranslations: {
  [key in AcceptedLanguages]?: {
    dateFNSKey: string
    translations: GenericTranslationsObject
  }
} = {}

for (const key of Object.keys(translations) as AcceptedLanguages[]) {
  allTranslations[key] = {
    dateFNSKey: translations[key]?.dateFNSKey || 'unknown-date-fns-key',
    translations: translations[key]?.translations || {},
  }
}

void translateObject({
  allTranslationsObject: allTranslations,
  fromTranslationsObject: enTranslations,
  targetFolder: path.resolve(dirname, '../../../../packages/translations/src/languages'),
})
