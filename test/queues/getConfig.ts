import type { Config } from 'payload'

import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { devUser } from '../credentials.js'
import { seed } from './seed.js'
import { CreateSimpleRetries0Task } from './tasks/CreateSimpleRetries0Task.js'
import { CreateSimpleRetriesUndefinedTask } from './tasks/CreateSimpleRetriesUndefinedTask.js'
import { CreateSimpleTask } from './tasks/CreateSimpleTask.js'
import { CreateSimpleWithDuplicateMessageTask } from './tasks/CreateSimpleWithDuplicateMessageTask.js'
import { ExternalTask } from './tasks/ExternalTask.js'
import { ReturnCustomErrorTask } from './tasks/ReturnCustomErrorTask.js'
import { ReturnErrorTask } from './tasks/ReturnErrorTask.js'
import { ThrowErrorTask } from './tasks/ThrowErrorTask.js'
import { UpdatePostStep2Task } from './tasks/UpdatePostStep2Task.js'
import { UpdatePostTask } from './tasks/UpdatePostTask.js'
import { externalWorkflow } from './workflows/externalWorkflow.js'
import { failsImmediatelyWorkflow } from './workflows/failsImmediately.js'
import { inlineTaskTestWorkflow } from './workflows/inlineTaskTest.js'
import { inlineTaskTestDelayedWorkflow } from './workflows/inlineTaskTestDelayed.js'
import { longRunningWorkflow } from './workflows/longRunning.js'
import { noRetriesSetWorkflow } from './workflows/noRetriesSet.js'
import { parallelTaskWorkflow } from './workflows/parallelTaskWorkflow.js'
import { retries0Workflow } from './workflows/retries0.js'
import { retriesBackoffTestWorkflow } from './workflows/retriesBackoffTest.js'
import { retriesRollbackTestWorkflow } from './workflows/retriesRollbackTest.js'
import { retriesTestWorkflow } from './workflows/retriesTest.js'
import { retriesWorkflowLevelTestWorkflow } from './workflows/retriesWorkflowLevelTest.js'
import { subTaskWorkflow } from './workflows/subTask.js'
import { subTaskFailsWorkflow } from './workflows/subTaskFails.js'
import { updatePostWorkflow } from './workflows/updatePost.js'
import { updatePostJSONWorkflow } from './workflows/updatePostJSON.js'
import { workflowAndTasksRetriesUndefinedWorkflow } from './workflows/workflowAndTasksRetriesUndefined.js'
import { workflowRetries2TasksRetries0Workflow } from './workflows/workflowRetries2TasksRetries0.js'
import { workflowRetries2TasksRetriesUndefinedWorkflow } from './workflows/workflowRetries2TasksRetriesUndefined.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

// Needs to be a function to prevent object reference issues due to duplicative configs
export const getConfig: () => Partial<Config> = () => ({
  collections: [
    {
      slug: 'posts',
      admin: {
        useAsTitle: 'title',
      },
      hooks: {
        afterChange: [
          async ({ req, doc, context }) => {
            await req.payload.jobs.queue({
              workflow: context.useJSONWorkflow ? 'updatePostJSONWorkflow' : 'updatePost',
              input: {
                post: doc.id,
                message: 'hello',
              },
              req,
            })
          },
        ],
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'content',
          type: 'richText',
        },
        {
          name: 'jobStep1Ran',
          type: 'text',
        },
        {
          name: 'jobStep2Ran',
          type: 'text',
        },
      ],
    },
    {
      slug: 'simple',
      admin: {
        useAsTitle: 'title',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
    autoLogin: {
      prefillOnly: true,
      email: devUser.email,
      password: devUser.password,
    },
  },
  jobs: {
    autoRun: [
      {
        silent: true,
        // Every second
        cron: '* * * * * *',
        limit: 100,
        queue: 'autorunSecond',
      },
      // add as many cron jobs as you want
    ],
    shouldAutoRun: () => true,
    jobsCollectionOverrides: ({ defaultJobsCollection }) => {
      return {
        ...defaultJobsCollection,
        admin: {
          ...(defaultJobsCollection?.admin || {}),
          hidden: false,
        },
      }
    },
    processingOrder: {
      queues: {
        lifo: '-createdAt',
      },
    },
    tasks: [
      UpdatePostTask,
      UpdatePostStep2Task,
      CreateSimpleTask,
      CreateSimpleRetriesUndefinedTask,
      CreateSimpleRetries0Task,
      CreateSimpleWithDuplicateMessageTask,
      ExternalTask,
      ThrowErrorTask,
      ReturnErrorTask,
      ReturnCustomErrorTask,
    ],
    workflows: [
      updatePostWorkflow,
      updatePostJSONWorkflow,
      retriesTestWorkflow,
      retriesRollbackTestWorkflow,
      retriesWorkflowLevelTestWorkflow,
      noRetriesSetWorkflow,
      retries0Workflow,
      workflowAndTasksRetriesUndefinedWorkflow,
      workflowRetries2TasksRetriesUndefinedWorkflow,
      workflowRetries2TasksRetries0Workflow,
      inlineTaskTestWorkflow,
      failsImmediatelyWorkflow,
      inlineTaskTestDelayedWorkflow,
      externalWorkflow,
      retriesBackoffTestWorkflow,
      subTaskWorkflow,
      subTaskFailsWorkflow,
      longRunningWorkflow,
      parallelTaskWorkflow,
    ],
  },
  editor: lexicalEditor(),
  onInit: async (payload) => {
    if (process.env.SEED_IN_CONFIG_ONINIT !== 'false') {
      await seed(payload)
    }
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
