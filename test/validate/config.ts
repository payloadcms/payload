import path from 'path'
import { fileURLToPath } from 'url'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { validationCollections } from './collections.js'
import { localeFilterOperationEvents } from './events.js'
import { validationGlobals } from './globals.js'
import {
  validationAccessSourceGlobalSlug,
  validationDraftSourceGlobalSlug,
  validationGlobalSlug,
  validationTempFilesDir,
} from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  config: {
    admin: {
      autoLogin: {
        email: devUser.email,
        password: devUser.password,
      },
      importMap: {
        baseDir: path.resolve(dirname),
      },
    },
    collections: validationCollections,
    globals: validationGlobals,
    jobs: {
      deleteJobOnComplete: false,
      tasks: [
        {
          slug: 'validationWriteGuardProbe',
          handler: () => ({ output: {} }),
          inputSchema: [],
          outputSchema: [],
        },
      ],
    },
    localization: {
      defaultLocale: 'en',
      filterAvailableLocales: ({ locales, req }) => {
        localeFilterOperationEvents.push(req.operation)
        const availableLocaleCodes = req.context.availableLocaleCodes as string[] | undefined

        return availableLocaleCodes
          ? locales.filter(({ code }) => availableLocaleCodes.includes(code))
          : locales
      },
      locales: [
        {
          code: 'en',
          label: 'English',
        },
        {
          code: 'es',
          label: 'Spanish',
        },
        {
          code: 'de',
          fallbackLocale: 'en',
          label: 'German',
        },
        {
          code: 'fr',
          label: 'French',
        },
      ],
    },
    upload: {
      tempFileDir: validationTempFilesDir,
      useTempFiles: true,
    },
  },
  seed: async (payload) => {
    if (process.env.NODE_ENV !== 'test') {
      await payload.create({
        collection: 'users',
        data: {
          email: devUser.email,
          password: devUser.password,
        },
        overrideAccess: true,
      })
    }

    await payload.updateGlobal({
      slug: validationGlobalSlug,
      data: {
        location: [-0.12, 51.5],
        metadata: {
          nestedTitle: 'Stored nested title',
        },
        summary: 'stored global summary',
        title: 'Stored global title',
      } as never,
      locale: 'en',
      overrideAccess: true,
    })
    await payload.updateGlobal({
      slug: validationDraftSourceGlobalSlug,
      data: {
        _status: 'draft',
        scope: 'draft-visible',
        title: 'Draft-only title',
      },
      draft: true,
      locale: 'en',
      overrideAccess: true,
    })
    await payload.updateGlobal({
      slug: validationAccessSourceGlobalSlug,
      data: {
        scope: 'stored-private',
        title: 'Stored private title',
      },
      locale: 'en',
      overrideAccess: true,
    })
  },
  suite: 'validate',
})
