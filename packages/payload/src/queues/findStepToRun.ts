import type { StepStatus } from './config/types.js'

export const findStepToRun = (
  stepStatus: StepStatus,
): { stepIndex: number; stepSlug: string } | undefined => {
  let stepIndex = 0 // Initialize index counter

  for (const [stepSlug, status] of stepStatus.entries()) {
    if (!status.complete) {
      return { stepIndex, stepSlug } // Return both step name and index
    }
    stepIndex++ // Increment index after each iteration
  }

  return undefined // Return undefined if no step matches the criteria
}
