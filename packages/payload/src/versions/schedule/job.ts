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
          publishSpecificLocale,
        })
      }

      if (input.global) {
        await req.payload.updateGlobal({
          slug: input.global,
          data: {
            _status,
          },
          depth: 0,
          publishSpecificLocale,
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
