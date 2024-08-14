/**
 * This test suites primarily tests the i18n types (in this config.ts, the ComponentWithCustomI18n.tsx and ComponentWithDefaultI18n.tsx) and the i18n functionality in the admin UI.
 *
 * Thus, please do not remove any ts-expect-error comments in this test suite. This test suite will eventually have to be compiled to ensure there are no type errors.
 */

import type {
  DefaultTranslationKeys,
  NestedKeysStripped,
  TFunction,
} from '@payloadcms/translations'

import { fileURLToPath } from 'node:url'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'

const customTranslationsObject = {
  en: {
    general: {
      test: 'My custom translation',
    },
  },
}

export type CustomTranslationsObject = typeof customTranslationsObject.en
export type CustomTranslationsKeys = NestedKeysStripped<CustomTranslationsObject>

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      afterDashboard: [
        '/ComponentWithDefaultI18n.js#ComponentWithDefaultI18n',
        '/ComponentWithCustomI18n.js#ComponentWithCustomI18n',
      ],
    },
  },
  collections: [
    {
      slug: 'collection1',
      fields: [
        {
          name: 'fieldDefaultI18nValid',
          type: 'text',
          label: ({ t }) => t('fields:addLabel'),
        },
        {
          name: 'fieldDefaultI18nInvalid',
          type: 'text',
          // @ts-expect-error // Keep the ts-expect-error comment. This NEEDS to throw an error
          label: ({ t }) => t('fields:addLabel2'),
        },
        {
          name: 'fieldCustomI18nValidDefault',
          type: 'text',
          label: ({ t }: { t: TFunction<CustomTranslationsKeys | DefaultTranslationKeys> }) =>
            t('fields:addLabel'),
        },
        {
          name: 'fieldCustomI18nValidCustom',
          type: 'text',
          label: ({ t }: { t: TFunction<CustomTranslationsKeys | DefaultTranslationKeys> }) =>
            t('general:test'),
        },
        {
          name: 'fieldCustomI18nInvalid',
          type: 'text',
          label: ({ t }: { t: TFunction<CustomTranslationsKeys | DefaultTranslationKeys> }) =>
            // @ts-expect-error // Keep the ts-expect-error comment. This NEEDS to throw an error
            t('fields:addLabel2'),
        },
      ],
    },
  ],
  i18n: {
    translations: customTranslationsObject,
  },
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
