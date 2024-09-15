import type { BaseJob, JobConfig, StepStatus } from './config/types.js'

type Args = {
  job: BaseJob
  jobConfig: JobConfig
}

export const createStepStatus = ({ job, jobConfig }: Args): StepStatus => {
  const stepStatus: StepStatus = new Map()

  // First, add (in order) the steps from the config to
  // our status map
  jobConfig.steps.forEach((stepConfig) => {
    stepStatus.set(stepConfig.schema.slug, {
      complete: false,
      retries: stepConfig.retries ?? 0,
      totalTried: 0,
    })
  })

  // Loop all logs and either increment totalTried
  // or set the step to complete
  if (Array.isArray(job.log)) {
    job.log.forEach((logStep) => {
      const stepConfig = jobConfig.steps[logStep.stepIndex]

      if (logStep.state === 'failed') {
        stepStatus[stepConfig.schema.slug].totalTried += 1
      } else {
        stepStatus[stepConfig.schema.slug].complete = true
      }
    })
  }

  return stepStatus
}
