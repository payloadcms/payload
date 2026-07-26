import type { Job, JobTaskStatus } from 'payload'

import { describe, expect, test } from 'tstyche'

import type { MyUpdatePostWorkflowType, PayloadJob } from './payload-types.js'

describe('Job type', () => {
  test('should use the generated payload-jobs collection type', () => {
    expect<Job['id']>().type.toBe<string>()
    expect<Job['meta']>().type.toBe<PayloadJob['meta']>()
    expect<Job['processing']>().type.toBe<PayloadJob['processing']>()
    expect<Job['processingToken']>().type.toBe<PayloadJob['processingToken']>()
    expect<Job['taskStatus']>().type.toBe<JobTaskStatus>()
  })

  test('should narrow input from a generated workflow slug', () => {
    expect<Job<'updatePost'>['input']>().type.toBe<MyUpdatePostWorkflowType['input']>()
  })
})
