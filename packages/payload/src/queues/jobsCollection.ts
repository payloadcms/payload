import type { CollectionConfig } from '../collections/config/types.js'
import type { Config } from '../config/types.js'
import type { BaseJob } from './config/types.js'

import { runWorkflowEndpoint } from './endpoint.js'

export const getDefaultJobsCollection: (config: Config) => CollectionConfig | null = (config) => {
  if (!Array.isArray(config?.jobs?.workflows)) {
    return null
  }

  const workflowSlugs: Set<string> = new Set()
  const taskSlugs: Set<string> = new Set()

  const queueNames: Set<string> = new Set(['default'])

  config.jobs.workflows.forEach((workflow) => {
    workflowSlugs.add(workflow.slug)

    if (workflow.queue) {
      queueNames.add(workflow.queue)
    }
  })

  config.jobs.tasks.forEach((task) => {
    taskSlugs.add(task.slug)
  })

  const jobsCollection: CollectionConfig = {
    slug: 'payload-jobs',
    admin: {
      group: 'System',
      hidden: true,
    },
    endpoints: [runWorkflowEndpoint],
    fields: [
      {
        name: 'input',
        type: 'json',
        admin: {
          description: 'Input data provided to the job',
        },
      },
      {
        type: 'tabs',
        tabs: [
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
                admin: {
                  description: 'Task execution log',
                },
                fields: [
                  {
                    name: 'executedAt',
                    type: 'date',
                    required: true,
                  },
                  {
                    name: 'completedAt',
                    type: 'date',
                    required: true,
                  },
                  {
                    name: 'taskSlug',
                    type: 'select',
                    options: [...taskSlugs],
                    required: true,
                  },
                  {
                    name: 'taskID',
                    type: 'text',
                    required: true,
                  },
                  {
                    name: 'input',
                    type: 'json',
                  },
                  {
                    name: 'output',
                    type: 'json',
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
        name: 'workflowSlug',
        type: 'select',
        admin: {
          position: 'sidebar',
        },
        index: true,
        options: [...workflowSlugs],
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
    hooks: {
      afterRead: [
        ({ doc }) => {
          // This hook is used to add the virtual `tasks` field to the document, that is computed from the `log` field

          const latestTasksAndIDs: {
            [taskSlug: string]: {
              [taskID: string]: BaseJob['log'][0]
            }
          } = {}

          for (const _loggedTask of doc.log) {
            const loggedTask = _loggedTask as BaseJob['log'][0]
            if (loggedTask.state !== 'succeeded') {
              continue
            }

            if (!latestTasksAndIDs[loggedTask.taskSlug]) {
              latestTasksAndIDs[loggedTask.taskSlug] = {
                [loggedTask.taskID]: loggedTask,
              }
            } else {
              const idsForTask = latestTasksAndIDs[loggedTask.taskSlug]
              if (
                !idsForTask[loggedTask.taskID] ||
                new Date(loggedTask.completedAt) >
                  new Date(idsForTask[loggedTask.taskID].completedAt)
              ) {
                latestTasksAndIDs[loggedTask.taskSlug][loggedTask.taskID] = loggedTask
              }
            }
          }

          doc.tasks = latestTasksAndIDs

          return doc
        },
      ],
    },
  }
  return jobsCollection
}
