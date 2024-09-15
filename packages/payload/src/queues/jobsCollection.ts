import type { CollectionConfig } from '../collections/config/types.js'
import type { Config } from '../config/types.js'
import type { Block } from '../fields/config/types.js'

import { runJobsEndpoint } from './endpoint.js'

export const getDefaultJobsCollection: (config: Config) => CollectionConfig | null = (config) => {
  if (!Array.isArray(config?.queues?.jobs)) {
    return null
  }

  const jobTypes: Set<string> = new Set()
  const queueNames: Set<string> = new Set(['default'])
  const steps: Map<string, Block> = new Map()

  config.queues.jobs.forEach((job) => {
    jobTypes.add(job.slug)

    if (job.queue) {
      queueNames.add(job.queue)
    }

    job.steps.forEach((step) => {
      steps.set(step.schema.slug, step.schema)
    })
  })

  const jobsCollection: CollectionConfig = {
    slug: 'payload-jobs',
    admin: {
      group: 'System',
      hidden: true,
    },
    endpoints: [runJobsEndpoint],
    fields: [
      {
        type: 'tabs',
        tabs: [
          {
            fields: [
              {
                name: 'steps',
                type: 'blocks',
                blocks: [...steps.values()],
              },
            ],
            label: 'Steps',
          },
          {
            fields: [
              {
                name: 'completedAt',
                type: 'date',
                index: true,
              },
              {
                name: 'hasError',
                type: 'checkbox',
                index: true,
              },
              {
                name: 'error',
                type: 'json',
                admin: {
                  condition: (data) => data.hasError,
                },
              },
              {
                name: 'log',
                type: 'array',
                fields: [
                  {
                    name: 'executedAt',
                    type: 'date',
                    required: true,
                  },
                  {
                    name: 'stepIndex',
                    type: 'number',
                    required: true,
                  },
                  {
                    name: 'state',
                    type: 'radio',
                    options: ['failed', 'succeeded'],
                    required: true,
                  },
                  {
                    name: 'error',
                    type: 'json',
                    admin: {
                      condition: (_, data) => data.state === 'failed',
                    },
                    required: true,
                  },
                ],
              },
            ],
            label: 'Status',
          },
        ],
      },
      {
        name: 'type',
        type: 'select',
        admin: {
          position: 'sidebar',
        },
        index: true,
        options: [...jobTypes],
        required: true,
      },
      {
        name: 'queue',
        type: 'select',
        admin: {
          position: 'sidebar',
        },
        defaultValue: 'default',
        index: true,
        options: [...queueNames],
      },
      {
        name: 'waitUntil',
        type: 'date',
        index: true,
      },
      {
        name: 'processing',
        type: 'checkbox',
        admin: {
          position: 'sidebar',
        },
        defaultValue: false,
        index: true,
      },
      {
        name: 'seenByWorker',
        type: 'checkbox',
        admin: {
          position: 'sidebar',
        },
        defaultValue: false,
      },
    ],
  }
  return jobsCollection
}
