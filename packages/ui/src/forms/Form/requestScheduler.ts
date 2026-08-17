import { createQueue } from '../../utilities/createQueue.js'

export type FormRequestIntent = 'autosave' | 'formState' | 'submit'

export type FormRequestContext = {
  dispatchedRevision: number
  isCurrent: () => boolean
  isGenerationCurrent: () => boolean
}

export type FormRequestTask<T> = {
  intent: FormRequestIntent
  run: (context: FormRequestContext) => Promise<T>
}

export type FormRequestResult<T> = { status: 'completed'; value: T } | { status: 'superseded' }

export type FormRequestScheduler = {
  reset: () => void
  schedule: <T>(task: FormRequestTask<T>) => Promise<FormRequestResult<T>>
}

const priority: Record<FormRequestIntent, number> = {
  autosave: 1,
  formState: 0,
  submit: 2,
}

export const createFormRequestScheduler = ({
  getRevision,
}: {
  getRevision: () => number
}): FormRequestScheduler => {
  const queue = createQueue({ getVersion: getRevision })

  return {
    reset: queue.reset,
    schedule: ({ intent, run }) =>
      queue.schedule({
        priority: priority[intent],
        run: ({ dispatchedVersion, isCurrent, isGenerationCurrent }) =>
          run({
            dispatchedRevision: dispatchedVersion,
            isCurrent,
            isGenerationCurrent,
          }),
      }),
  }
}
