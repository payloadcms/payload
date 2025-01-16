import type { CollectionConfig } from '../../collections/config/types.js'
import type { Config } from '../../config/types.js'
import type { Field } from '../../fields/config/types.js'

import { runJobsEndpoint } from '../restEndpointRun.js'
import { getJobTaskStatus } from '../utilities/getJobTaskStatus.js'

export const getDefaultJobsCollection: (config: Config) => CollectionConfig | null = (config) => {
  if (!Array.isArray(config?.jobs?.workflows)) {
    return null
  }

  const workflowSlugs: Set<string> = new Set()
  const taskSlugs: Set<string> = new Set(['inline'])

  if (config.jobs?.workflows.length) {
    config.jobs?.workflows.forEach((workflow) => {
      workflowSlugs.add(workflow.slug)
    })
  }

  if (config.jobs?.tasks.length) {
    config.jobs.tasks.forEach((task) => {
      if (workflowSlugs.has(task.slug)) {
        throw new Error(
          `Task slug "${task.slug}" is already used by a workflow. No tasks are allowed to have the same slug as a workflow.`,
        )
      }
      taskSlugs.add(task.slug)
    })
  }

  const logFields: Field[] = [
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
  ]

  if (config?.jobs?.addParentToTaskLog) {
    logFields.push({
      name: 'parent',
      type: 'group',
      fields: [
        {
          name: 'taskSlug',
          type: 'select',
          options: [...taskSlugs],
        },
        {
          name: 'taskID',
          type: 'text',
        },
      ],
    })
  }

  const jobsCollection: CollectionConfig = {
    slug: 'payload-jobs',
    admin: {
      group: 'System',
      hidden: true,
    },
    endpoints: [runJobsEndpoint],
    fields: [
      {
        name: 'input',
        type: 'json',
        admin: {
          description: 'Input data provided to the job',
        },
      },
      {
        name: 'taskStatus',
        type: 'json',
        virtual: true,
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
                name: 'totalTried',
                type: 'number',
                defaultValue: 0,
                index: true,
              },
              {
                name: 'hasError',
                type: 'checkbox',
                admin: {
                  description: 'If hasError is true this job will not be retried',
                },
                defaultValue: false,
                index: true,
              },
              {
                name: 'error',
                type: 'json',
                admin: {
                  condition: (data) => data.hasError,
                  description: 'If hasError is true, this is the error that caused it',
                },
              },
              {
                name: 'log',
                type: 'array',
                admin: {
                  description: 'Task execution log',
                },
                fields: logFields,
              },
            ],
            label: 'Status',
          },
        ],
      },
      // only include the workflowSlugs field if workflows exist
      ...((workflowSlugs.size > 0
        ? [
            {
              name: 'workflowSlug',
              type: 'select',
              admin: {
                position: 'sidebar',
              },
              index: true,
              options: [...workflowSlugs],
            },
          ]
        : []) as Field[]),
      {
        name: 'taskSlug',
        type: 'select',
        admin: {
          position: 'sidebar',
        },
        index: true,
        options: [...taskSlugs],
        required: false,
      },
      {
        name: 'queue',
        type: 'text',
        admin: {
          position: 'sidebar',
        },
        defaultValue: 'default',
        index: true,
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
    ],
    hooks: {
      afterRead: [
        ({ doc, req }) => {
          // This hook is used to add the virtual `tasks` field to the document, that is computed from the `log` field

          doc.taskStatus = getJobTaskStatus({
            jobLog: doc.log,
            tasksConfig: req.payload.config.jobs.tasks,
          })

          return doc
        },
      ],
    },
    lockDocuments: false,
  }

  return jobsCollection
}
