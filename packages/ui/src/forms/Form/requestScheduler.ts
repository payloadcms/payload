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

type PendingEntry = {
  intent: FormRequestIntent
  reject: (reason: unknown) => void
  resolve: (result: FormRequestResult<unknown>) => void
  run: (context: FormRequestContext) => Promise<unknown>
}

export const createFormRequestScheduler = ({
  getRevision,
}: {
  getRevision: () => number
}): FormRequestScheduler => {
  let generation = 0
  let isActive = false
  let pending: PendingEntry | undefined

  const start = (entry: PendingEntry): void => {
    isActive = true

    const activeGeneration = generation
    const dispatchedRevision = getRevision()
    const isGenerationCurrent = () => generation === activeGeneration
    const context: FormRequestContext = {
      dispatchedRevision,
      isCurrent: () => isGenerationCurrent() && getRevision() === dispatchedRevision,
      isGenerationCurrent,
    }

    const taskPromise = (async () => entry.run(context))()

    void taskPromise
      .then(
        (value) => entry.resolve({ status: 'completed', value }),
        (error) => entry.reject(error),
      )
      .finally(() => {
        isActive = false

        const next = pending
        pending = undefined

        if (next) {
          start(next)
        }
      })
  }

  const reset = (): void => {
    generation += 1

    if (pending) {
      pending.resolve({ status: 'superseded' })
      pending = undefined
    }
  }

  const schedule = <T>(task: FormRequestTask<T>): Promise<FormRequestResult<T>> => {
    let resolve!: (result: FormRequestResult<T>) => void
    let reject!: (reason: unknown) => void
    const result = new Promise<FormRequestResult<T>>((resolvePromise, rejectPromise) => {
      resolve = resolvePromise
      reject = rejectPromise
    })
    const entry: PendingEntry = {
      intent: task.intent,
      reject,
      resolve: resolve as (result: FormRequestResult<unknown>) => void,
      run: task.run as (context: FormRequestContext) => Promise<unknown>,
    }

    if (!isActive) {
      start(entry)
      return result
    }

    if (!pending || priority[entry.intent] >= priority[pending.intent]) {
      pending?.resolve({ status: 'superseded' })
      pending = entry
    } else {
      resolve({ status: 'superseded' })
    }

    return result
  }

  return { reset, schedule }
}
