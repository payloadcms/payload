import type { Field } from '../../fields/config/types.js'
import type { TypedUser } from '../../index.js'
import type { TaskConfig } from '../../queues/config/types/taskTypes.js'
import type { SchedulePublishTaskInput } from './types.js'

type Args = {
  authCollectionSlugs: string[]
  collections: string[]
  globals: string[]
}

export const getSchedulePublishTask = ({
  authCollectionSlugs,
  collections,
  globals,
}: Args): TaskConfig<{ input: SchedulePublishTaskInput; output: object }> => {
  return {
    slug: 'schedulePublish',
    handler: async ({ input, req }) => {
      const _status = input?.type === 'publish' || !input?.type ? 'published' : 'draft'

      let user: null | TypedUser = null

      if (input.user != null) {
        if (typeof input.user !== 'object') {
          // Legacy jobs lack enough information to restore the scheduling user identity safely, so fail closed.
          const target = input.doc
            ? ` for the ${input.doc.relationTo} document with ID ${input.doc.value}`
            : input.global
              ? ` for the ${input.global} global`
              : ''

          throw new Error(
            `Scheduled publish job was queued before Payload preserved the scheduling user's auth collection and cannot be run safely. Re-schedule the publish${target} from the admin panel.`,
          )
        }

        user = (await req.payload.findByID({
          id: input.user.value,
          collection: input.user.relationTo,
          depth: 0,
        })) as TypedUser

        user.collection = input.user.relationTo
      }

      let publishSpecificLocale: string
      let unpublishSpecificLocale: string | undefined

      if (input.locale && req.payload.config.localization) {
        const matchedLocale = req.payload.config.localization.locales.find(
          ({ code }) => code === input.locale,
        )

        if (matchedLocale) {
          if (_status === 'published') {
            publishSpecificLocale = input.locale
          } else {
            unpublishSpecificLocale = input.locale
          }
        }
      }

      // A job without a locale acts on every locale, as on main. With localized status, the update
      // otherwise runs in the default locale only: the schedule drawer's "All" published the default
      // locale alone, and an unpublish, which the drawer queues without a locale, unpublished it alone.
      const isAllLocales = Boolean(req.payload.config.localization) && !input.locale
      const allLocalesArgs = isAllLocales
        ? _status === 'published'
          ? { publishAllLocales: true }
          : { unpublishAllLocales: true }
        : {}

      if (input.doc) {
        // input.doc.value is always a string (#10481); coerce back to the real ID type.
        const idType =
          req.payload.collections[input.doc.relationTo]?.customIDType ??
          req.payload.db?.defaultIDType ??
          'text'
        const id = idType === 'number' ? Number(input.doc.value) : input.doc.value

        await req.payload.update({
          id,
          collection: input.doc.relationTo,
          data: {
            _status,
          },
          depth: 0,
          ...(unpublishSpecificLocale ? { locale: unpublishSpecificLocale } : {}),
          ...allLocalesArgs,
          overrideAccess: user === null,
          publishSpecificLocale: publishSpecificLocale!,
          user,
        })
      }

      if (input.global) {
        await req.payload.updateGlobal({
          slug: input.global,
          data: {
            _status,
          },
          depth: 0,
          ...(unpublishSpecificLocale ? { locale: unpublishSpecificLocale } : {}),
          ...allLocalesArgs,
          overrideAccess: user === null,
          publishSpecificLocale: publishSpecificLocale!,
          user,
        })
      }

      return {
        output: {},
      }
    },
    inputSchema: [
      {
        name: 'type',
        type: 'radio',
        defaultValue: 'publish',
        options: ['publish', 'unpublish'],
      },
      {
        name: 'locale',
        type: 'text',
      },
      ...(collections.length > 0
        ? [
            {
              name: 'doc',
              type: 'relationship',
              relationTo: collections,
            } satisfies Field,
          ]
        : []),
      {
        name: 'global',
        type: 'select',
        options: globals,
      },
      {
        name: 'user',
        type: 'relationship',
        relationTo: authCollectionSlugs,
      },
    ],
  }
}
