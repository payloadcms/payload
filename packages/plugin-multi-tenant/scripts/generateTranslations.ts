import type { AcceptedLanguages, GenericTranslationsObject } from '@payloadcms/translations'

import path from 'path'
import { fileURLToPath } from 'url'

import { translateObject } from '../../translations/scripts/translateNewKeys/index.js'
import { translations } from '../src/translations/index.js'
import { enTranslations } from '../src/translations/languages/en.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const allTranslations: {
  [key in AcceptedLanguages]?: {
    dateFNSKey: string
    translations: GenericTranslationsObject
  }
} = {}

for (const key of Object.keys(translations)) {
  allTranslations[key as AcceptedLanguages] = {
    dateFNSKey: translations[key as AcceptedLanguages]?.dateFNSKey ?? 'unknown-date-fns-key',
    translations: translations[key as AcceptedLanguages]?.translations ?? {},
  }
}

void translateObject({
  allTranslationsObject: allTranslations,
  fromTranslationsObject: enTranslations,
  targetFolder: path.resolve(dirname, '../src/translations/languages'),
  tsFilePrefix: `import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'\n\nexport const {{locale}}Translations: PluginDefaultTranslationsObject = `,
  tsFileSuffix: `\n\nexport const {{locale}}: PluginLanguage = {
    dateFNSKey: {{dateFNSKey}},
    translations: {{locale}}Translations,
  }  `,
})
