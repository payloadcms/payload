import type { Job, JobTaskStatus, PayloadTypes, WorkflowConfig } from 'payload'

import { describe, expect, test } from 'tstyche'

import type {
  MyUpdatePostWorkflowType,
  PayloadJob,
  PayloadJobsStat,
  WorkflowUpdatePostJSONWorkflow,
} from './payload-types.js'

describe('Job type', () => {
  test('should use the generated payload-jobs collection type', () => {
    expect<Job['id']>().type.toBe<string>()
    expect<Job['meta']>().type.toBe<PayloadJob['meta']>()
    expect<Job['processingToken']>().type.toBe<PayloadJob['processingToken']>()
    expect<Job['processingUntil']>().type.toBe<PayloadJob['processingUntil']>()
    expect<Job['taskStatus']>().type.toBe<JobTaskStatus>()
  })

  test('should narrow input from a generated workflow slug', () => {
    expect<Job<'updatePost'>['input']>().type.toBe<MyUpdatePostWorkflowType['input']>()
  })

  test('should generate the jobs stats global whenever jobs are enabled', () => {
    expect<PayloadTypes['globals']['payload-jobs-stats']>().type.toBe<PayloadJobsStat>()
  })
})

describe('JSON workflow types', () => {
  test('should type step callbacks from the generated workflow slug', () => {
    const workflow: WorkflowConfig<'updatePostJSONWorkflow'> = {
      slug: 'updatePostJSONWorkflow',
      handler: [
        {
          id: 'run-update',
          condition: ({ job }) => {
            expect(job).type.toBe<Job<'updatePostJSONWorkflow'>>()
            expect(job.input).type.toBe<WorkflowUpdatePostJSONWorkflow['input']>()

            return job.input.message.length > 0
          },
          input: ({ job }) => {
            expect(job).type.toBe<Job<'updatePostJSONWorkflow'>>()
            expect(job.input).type.toBe<WorkflowUpdatePostJSONWorkflow['input']>()

            return {
              message: job.input.message,
              post: job.input.post,
            }
          },
          task: 'UpdatePost',
        },
        {
          id: 'run-inline',
          inlineTask: ({ job }) => {
            expect(job).type.toBe<Job<'updatePostJSONWorkflow'>>()
            expect(job.input).type.toBe<WorkflowUpdatePostJSONWorkflow['input']>()

            return {
              output: {
                messageTwice: `${job.input.message}${job.input.message}`,
              },
            }
          },
        },
      ],
    }

    expect(workflow).type.toBeAssignableTo<WorkflowConfig<'updatePostJSONWorkflow'>>()
  })
})
