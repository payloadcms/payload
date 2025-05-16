import type { TaskConfig } from 'payload'

import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { updatePostStep1, updatePostStep2 } from './runners/updatePost.js'
import { clearAndSeedEverything } from './seed.js'
import { externalWorkflow } from './workflows/externalWorkflow.js'
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

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
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
      {
        retries: 2,
        slug: 'UpdatePost',
        interfaceName: 'MyUpdatePostType',
        inputSchema: [
          {
            name: 'post',
            type: 'relationship',
            relationTo: 'posts',
            maxDepth: 0,
            required: true,
          },
          {
            name: 'message',
            type: 'text',
            required: true,
          },
        ],
        outputSchema: [
          {
            name: 'messageTwice',
            type: 'text',
            required: true,
          },
        ],
        handler: updatePostStep1,
      } as TaskConfig<'UpdatePost'>,
      {
        retries: 2,
        slug: 'UpdatePostStep2',
        inputSchema: [
          {
            name: 'post',
            type: 'relationship',
            relationTo: 'posts',
            maxDepth: 0,
            required: true,
          },
          {
            name: 'messageTwice',
            type: 'text',
            required: true,
          },
        ],
        handler: updatePostStep2,
      } as TaskConfig<'UpdatePostStep2'>,
      {
        retries: 3,
        slug: 'CreateSimple',
        inputSchema: [
          {
            name: 'message',
            type: 'text',
            required: true,
          },
          {
            name: 'shouldFail',
            type: 'checkbox',
          },
        ],
        outputSchema: [
          {
            name: 'simpleID',
            type: 'text',
            required: true,
          },
        ],
        handler: async ({ input, req }) => {
          if (input.shouldFail) {
            throw new Error('Failed on purpose')
          }
          const newSimple = await req.payload.create({
            collection: 'simple',
            req,
            data: {
              title: input.message,
            },
          })
          return {
            output: {
              simpleID: newSimple.id,
            },
          }
        },
      } as TaskConfig<'CreateSimple'>,
      {
        slug: 'CreateSimpleRetriesUndefined',
        inputSchema: [
          {
            name: 'message',
            type: 'text',
            required: true,
          },
          {
            name: 'shouldFail',
            type: 'checkbox',
          },
        ],
        outputSchema: [
          {
            name: 'simpleID',
            type: 'text',
            required: true,
          },
        ],
        handler: async ({ input, req }) => {
          if (input.shouldFail) {
            throw new Error('Failed on purpose')
          }
          const newSimple = await req.payload.create({
            collection: 'simple',
            req,
            data: {
              title: input.message,
            },
          })
          return {
            output: {
              simpleID: newSimple.id,
            },
          }
        },
      } as TaskConfig<'CreateSimpleRetriesUndefined'>,
      {
        slug: 'CreateSimpleRetries0',
        retries: 0,
        inputSchema: [
          {
            name: 'message',
            type: 'text',
            required: true,
          },
          {
            name: 'shouldFail',
            type: 'checkbox',
          },
        ],
        outputSchema: [
          {
            name: 'simpleID',
            type: 'text',
            required: true,
          },
        ],
        handler: async ({ input, req }) => {
          if (input.shouldFail) {
            throw new Error('Failed on purpose')
          }
          const newSimple = await req.payload.create({
            collection: 'simple',
            req,
            data: {
              title: input.message,
            },
          })
          return {
            output: {
              simpleID: newSimple.id,
            },
          }
        },
      } as TaskConfig<'CreateSimpleRetries0'>,
      {
        retries: 2,
        slug: 'CreateSimpleWithDuplicateMessage',
        inputSchema: [
          {
            name: 'message',
            type: 'text',
            required: true,
          },
          {
            name: 'shouldFail',
            type: 'checkbox',
          },
        ],
        outputSchema: [
          {
            name: 'simpleID',
            type: 'text',
            required: true,
          },
        ],
        handler: async ({ input, req }) => {
          if (input.shouldFail) {
            throw new Error('Failed on purpose')
          }
          const newSimple = await req.payload.create({
            collection: 'simple',
            req,
            data: {
              title: input.message + input.message,
            },
          })
          return {
            output: {
              simpleID: newSimple.id,
            },
          }
        },
      } as TaskConfig<'CreateSimpleWithDuplicateMessage'>,
      {
        retries: 2,
        slug: 'ExternalTask',
        inputSchema: [
          {
            name: 'message',
            type: 'text',
            required: true,
          },
        ],
        outputSchema: [
          {
            name: 'simpleID',
            type: 'text',
            required: true,
          },
        ],
        handler: path.resolve(dirname, 'runners/externalTask.ts') + '#externalTaskHandler',
      } as TaskConfig<'ExternalTask'>,
      {
        retries: 0,
        slug: 'ThrowError',
        inputSchema: [],
        outputSchema: [],
        handler: () => {
          throw new Error('failed')
        },
      } as TaskConfig<'ThrowError'>,
      {
        retries: 0,
        slug: 'ReturnError',
        inputSchema: [],
        outputSchema: [],
        handler: () => {
          return {
            state: 'failed',
          }
        },
      } as TaskConfig<'ReturnError'>,
      {
        retries: 0,
        slug: 'ReturnCustomError',
        inputSchema: [
          {
            name: 'errorMessage',
            type: 'text',
            required: true,
          },
        ],
        outputSchema: [],
        handler: ({ input }) => {
          return {
            state: 'failed',
            errorMessage: input.errorMessage,
          }
        },
      } as TaskConfig<'ReturnCustomError'>,
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
      await clearAndSeedEverything(payload)
    }
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
