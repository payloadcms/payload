import type { CollectionConfig } from '../../collections/config/types.js'
import type { SanitizedConfig } from '../../config/types.js'
import type { Field } from '../../fields/config/types.js'
import type { Job } from '../../index.js'

import { handleSchedulesJobsEndpoint } from '../endpoints/handleSchedules.js'
import { runJobsEndpoint } from '../endpoints/run.js'
import { getJobTaskStatus } from '../utilities/getJobTaskStatus.js'

export const jobsCollectionSlug = 'payload-jobs'

export const getDefaultJobsCollection: (jobsConfig: SanitizedConfig['jobs']) => CollectionConfig = (
  jobsConfig,
) => {
  const workflowSlugs: Set<string> = new Set()
  const taskSlugs: Set<string> = new Set(['inline'])

  if (jobsConfig.workflows?.length) {
    jobsConfig.workflows.forEach((workflow) => {
      workflowSlugs.add(workflow.slug)
    })
  }

  if (jobsConfig.tasks?.length) {
    jobsConfig.tasks.forEach((task) => {
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
    /**
     * @todo make required in 4.0
     */
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

  if (jobsConfig.addParentToTaskLog) {
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
    slug: jobsCollectionSlug,
    admin: {
      group: 'System',
      hidden: true,
    },
    endpoints: [runJobsEndpoint, handleSchedulesJobsEndpoint],
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
        admin: {
          date: { pickerAppearance: 'dayAndTime' },
        },
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

          return jobAfterRead({ config: req.payload.config, doc })
        },
      ],
      /**
       * If another update comes in after a job as already been cancelled, we need to make sure that update doesn't
       * change the state of the job.
       */
      beforeChange: [
        ({ data, originalDoc }) => {
          if (originalDoc?.error?.cancelled) {
            data.processing = false
            data.hasError = true
            delete data.completedAt
            delete data.waitUntil
          }
          return data
        },
      ],
    },
    lockDocuments: false,
  }

  if (jobsConfig.stats) {
    // TODO: In 4.0, this should be added by default.
    // The meta field can be used to store arbitrary data about the job. The scheduling system uses this to store
    // `scheduled: true` to indicate that the job was queued by the scheduling system.
    jobsCollection.fields.push({
      name: 'meta',
      type: 'json',
    })
  }
  return jobsCollection
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function jobAfterRead({ config, doc }: { config: SanitizedConfig; doc: Job }): Job {
  doc.taskStatus = getJobTaskStatus({
    jobLog: doc.log || [],
  })
  doc.input = doc.input || {}
  doc.taskStatus = doc.taskStatus || {}
  return doc
}
