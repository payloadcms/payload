import type { AcceptedLanguages, GenericTranslationsObject } from '@payloadcms/translations'

import path from 'path'
import { fileURLToPath } from 'url'

import { translations } from '../../../../packages/plugin-multi-tenant/src/translations/index.js'
import { enTranslations } from '../../../../packages/plugin-multi-tenant/src/translations/languages/en.js'
import { translateObject } from './utils/index.js'

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
  targetFolder: path.resolve(
    dirname,
    '../../../../packages/plugin-multi-tenant/src/translations/languages',
  ),
  tsFilePrefix: `import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'\n\nexport const {{locale}}Translations: PluginDefaultTranslationsObject = `,
  tsFileSuffix: `\n\nexport const {{locale}}: PluginLanguage = {
    dateFNSKey: {{dateFNSKey}},
    translations: {{locale}}Translations,
  }  `,
})
