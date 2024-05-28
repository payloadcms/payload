import path from 'path'
import { fileURLToPath } from 'url'

import type { AcceptedLanguages, GenericTranslationsObject } from '../../src/types.js'

import { translations } from '../../src/exports/all.js'
import { enTranslations } from '../../src/languages/en.js'
import { translateObject } from './index.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const allTranslations: {
  [key in AcceptedLanguages]?: {
    dateFNSKey: string
    translations: GenericTranslationsObject
  }
} = {}

for (const key of Object.keys(translations)) {
  allTranslations[key] = {
    dateFNSKey: translations[key].dateFNSKey,
    translations: translations[key].translations,
  }
}

void translateObject({
  allTranslationsObject: allTranslations,
  fromTranslationsObject: enTranslations,
  //languages: ['de'],
  targetFolder: path.resolve(dirname, '../../src/languages'),
})
