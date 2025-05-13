import type { AcceptedLanguages, GenericTranslationsObject } from '@payloadcms/translations'

import path from 'path'
import { fileURLToPath } from 'url'

import { translations } from '../../../../packages/translations/src/exports/all.js'
import { enTranslations } from '../../../../packages/translations/src/languages/en.js'
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
  //languages: ['de'],
  targetFolder: path.resolve(dirname, '../../../../packages/translations/src/languages'),
})
