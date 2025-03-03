// @ts-strict-ignore
import type { PayloadRequest } from '../../../../types/index.js'
import type { BaseJob, WorkflowConfig, WorkflowTypes } from '../../../config/types/workflowTypes.js'
import type { RunTaskFunctionState } from './getRunTaskFunction.js'

import { calculateBackoffWaitUntil } from './calculateBackoffWaitUntil.js'

/**
 * This is called if a workflow catches an error. It determines if it's a final error
 * or not and handles logging.
 */
export function handleWorkflowError({
  error,
  job,
  req,
  state,
  workflowConfig,
}: {
  error: Error
  job: BaseJob
  req: PayloadRequest
  state: RunTaskFunctionState
  workflowConfig: WorkflowConfig<WorkflowTypes>
}): {
  hasFinalError: boolean
} {
  const jobLabel = job.workflowSlug || `Task: ${job.taskSlug}`

  let hasFinalError = state.reachedMaxRetries || !!('cancelled' in error && error.cancelled) // If any TASK reached max retries, the job has an error
  const maxWorkflowRetries: number =
    (typeof workflowConfig.retries === 'object'
      ? workflowConfig.retries.attempts
      : workflowConfig.retries) ?? undefined

  if (
    maxWorkflowRetries !== undefined &&
    maxWorkflowRetries !== null &&
    job.totalTried >= maxWorkflowRetries
  ) {
    hasFinalError = true
    state.reachedMaxRetries = true
  }

  // Now let's handle workflow retries
  if (!hasFinalError) {
    if (job.waitUntil) {
      // Check if waitUntil is in the past
      const waitUntil = new Date(job.waitUntil)
      if (waitUntil < new Date()) {
        // Outdated waitUntil, remove it
        delete job.waitUntil
      }
    }

    // Job will retry. Let's determine when!
    const waitUntil: Date = calculateBackoffWaitUntil({
      retriesConfig: workflowConfig.retries,
      totalTried: job.totalTried ?? 0,
    })

    // Update job's waitUntil only if this waitUntil is later than the current one
    if (!job.waitUntil || waitUntil > new Date(job.waitUntil)) {
      job.waitUntil = waitUntil.toISOString()
    }
  }

  req.payload.logger.error({
    err: error,
    msg: `Error running job ${jobLabel} id: ${job.id} attempt ${job.totalTried + 1}${maxWorkflowRetries !== undefined ? '/' + (maxWorkflowRetries + 1) : ''}`,
  })

  return {
    hasFinalError,
  }
}
