import type { Job, JobTaskStatus, PayloadTypes } from 'payload'

import { describe, expect, test } from 'tstyche'

import type { MyUpdatePostWorkflowType, PayloadJob, PayloadJobsStat } from './payload-types.js'

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
