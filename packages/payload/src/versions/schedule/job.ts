import type { Field } from '../../fields/config/types.js'
import type { User } from '../../index.js'
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
          locale: input.locale,
          overrideAccess: user === null,
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
          locale: input.locale,
          overrideAccess: user === null,
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
