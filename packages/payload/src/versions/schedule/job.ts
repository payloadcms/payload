import type { TaskConfig } from '../../queues/config/types/taskTypes.js'
import type { SchedulePublishTaskInput } from './types.js'

type Args = {
  collections: string[]
  globals: string[]
}

export const getSchedulePublishTask = ({
  collections,
  globals,
}: Args): TaskConfig<{ input: SchedulePublishTaskInput; output: object }> => {
  return {
    slug: 'schedulePublish',
    handler: async ({ input, req }) => {
      const _status = input?.type === 'publish' || !input?.type ? 'published' : 'draft'

      if (input.doc) {
        await req.payload.update({
          id: input.doc.value,
          collection: input.doc.relationTo,
          data: {
            _status,
          },
          depth: 0,
        })
      }

      if (input.global) {
        await req.payload.updateGlobal({
          slug: input.global,
          data: {
            _status,
          },
          depth: 0,
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
        name: 'doc',
        type: 'relationship',
        relationTo: collections,
      },
      {
        name: 'global',
        type: 'select',
        options: globals,
      },
    ],
  }
}
