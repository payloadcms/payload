import { pathToFileURL } from 'url'

import type { PayloadRequest } from '../types/index.js'
import type { BaseJob, JobConfig, JobRunner, StepStatus } from './config/types.js'

import { findStepToRun } from './findStepToRun.js'

type Args = {
  job: BaseJob
  jobConfig: JobConfig
  req: PayloadRequest
  stepStatus: StepStatus
}

export const runStep = async ({ job, jobConfig, req, stepStatus }: Args) => {
  const stepToRun = findStepToRun(stepStatus)

  if (!stepToRun) {
    return
  }

  const { stepIndex, stepSlug } = stepToRun

  const isLastStep = stepIndex === stepStatus.size - 1

  if (!stepSlug) {
    return
  }

  const stepConfig = jobConfig.steps.find((step) => step.schema.slug === stepSlug)

  if (!stepConfig) {
    return
  }

  const stepDataFromJob = job.steps[stepIndex]

  if (!stepDataFromJob) {
    return
  }

  const stepData = { ...stepDataFromJob }

  delete stepData.blockType
  delete stepData.blockName
  delete stepData.id

  try {
    // the runner will either be passed to the config
    // OR it will be a path, which we will need to import via eval to avoid
    // Next.js compiler dynamic import expression errors

    let runner: JobRunner<unknown>

    if (typeof stepConfig.run === 'function') {
      runner = stepConfig.run
    } else {
      const [runnerPath, runnerImportName] = stepConfig.run.split('#')

      const runnerModule =
        typeof require === 'function'
          ? await eval(`require('${runnerPath.replaceAll('\\', '/')}')`)
          : await eval(`import('${pathToFileURL(runnerPath).href}')`)

      // If the path has indicated an #exportName, try to get it
      if (runnerImportName && runnerModule[runnerImportName]) {
        runner = runnerModule[runnerImportName]
      }

      // If there is a default export, use it
      if (!runner && runnerModule.default) {
        runner = runnerModule.default
      }

      // Finally, use whatever was imported
      if (!runner) {
        runner = runnerModule
      }

      if (!runner) {
        const errorMessage = `Can't find runner while importing with the path ${stepConfig.run} in job type ${job.type}.`
        req.payload.logger.error(errorMessage)

        await req.payload.update({
          id: job.id,
          collection: 'payload-jobs',
          data: {
            error: {
              error: errorMessage,
            },
            hasError: true,
            log: [
              ...job.log,
              {
                error: errorMessage,
                executedAt: new Date(),
                state: 'failed',
                stepIndex,
              },
            ],
            processing: false,
          },
          req,
        })

        return
      }
    }

    await req.payload.update({
      id: job.id,
      collection: 'payload-jobs',
      data: {
        processing: true,
        seenByWorker: true,
      },
      req,
    })

    // Run the job
    await runner({ job, req, step: stepData })

    // Job step has completed.
    // Create a new instance of stepStatus
    // and mark the current step as complete
    // so that when the next call to `runStep` is initiated,
    // it sees the current step as completed
    const newStepStatus = new Map(stepStatus)
    newStepStatus.set(stepSlug, {
      ...newStepStatus.get(stepSlug),
      complete: true,
    })

    if (isLastStep) {
      // If we should delete the job on completion,
      // simply delete it at this point
      if (req.payload.config.queues.deleteJobOnComplete) {
        await req.payload.delete({
          id: job.id,
          collection: 'payload-jobs',
          req,
        })
      } else {
        // If jobs are retained,
        // mark the job as complete
        await req.payload.update({
          id: job.id,
          collection: 'payload-jobs',
          data: {
            completedAt: new Date(),
            log: [
              ...job.log,
              {
                executedAt: new Date(),
                state: 'succeeded',
                stepIndex,
              },
            ],
            processing: false,
          },
          req,
        })
      }
    } else {
      // There are more steps to run, but we still need to update
      // the job with the updated log
      await req.payload.update({
        id: job.id,
        collection: 'payload-jobs',
        data: {
          log: [
            ...job.log,
            {
              executedAt: new Date(),
              state: 'succeeded',
              stepIndex,
            },
          ],
        },
        req,
      })

      // Run the next step!
      await runStep({ job, jobConfig, req, stepStatus: newStepStatus })
    }
  } catch (err) {
    req.payload.logger.error({
      err,
      msg: `There was an error while running job ${job.id}.`,
    })

    const failedStepStatus = stepStatus.get(stepSlug)

    const dataToUpdate: Record<string, unknown> = {
      log: [
        ...job.log,
        {
          error: err,
          executedAt: new Date(),
          state: 'failed',
          stepIndex,
        },
      ],
      processing: false,
    }

    // If the step has tried and failed more than the allowed retries,
    // then set the entire job to errored
    if (failedStepStatus.totalTried + 1 >= failedStepStatus.retries) {
      dataToUpdate.hasError = true
      dataToUpdate.error = err
    }

    await req.payload.update({
      id: job.id,
      collection: 'payload-jobs',
      data: dataToUpdate,
      req,
    })
  }
}
