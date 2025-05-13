// @ts-strict-ignore
import type { User } from '../../auth/types.js'
import type { Field } from '../../fields/config/types.js'
import type { TaskConfig } from '../../queues/config/types/taskTypes.js'
import type { SchedulePublishTaskInput } from './types.js'

type Args = {
  adminUserSlug: string
  collections: string[]
  globals: string[]
}

export const getSchedulePublishTask = ({
  adminUserSlug,
  collections,
  globals,
}: Args): TaskConfig<{ input: SchedulePublishTaskInput; output: object }> => {
  return {
    slug: 'schedulePublish',
    handler: async ({ input, req }) => {
      const _status = input?.type === 'publish' || !input?.type ? 'published' : 'draft'

      const userID = input.user

      let user: null | User = null

      if (userID) {
        user = (await req.payload.findByID({
          id: userID,
          collection: adminUserSlug,
          depth: 0,
        })) as User

        user.collection = adminUserSlug
      }

      let publishSpecificLocale: string

      if (input?.type === 'publish' && input.locale && req.payload.config.localization) {
        const matchedLocale = req.payload.config.localization.locales.find(
          ({ code }) => code === input.locale,
        )

        if (matchedLocale) {
          publishSpecificLocale = input.locale
        }
      }

      if (input.doc) {
        await req.payload.update({
          id: input.doc.value,
          collection: input.doc.relationTo,
          data: {
            _status,
          },
          depth: 0,
          overrideAccess: user === null,
          publishSpecificLocale,
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
          overrideAccess: user === null,
          publishSpecificLocale,
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
        relationTo: adminUserSlug,
      },
    ],
  }
}
