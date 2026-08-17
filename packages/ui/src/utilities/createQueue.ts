export type QueueContext<TVersion = undefined> = {
  /** The external version captured when this task began running. */
  dispatchedVersion: TVersion
  /** Whether both the queue generation and external version are still current. */
  isCurrent: () => boolean
  /** Whether the queue has not been reset since this task began running. */
  isGenerationCurrent: () => boolean
}

export type QueueTask<T, TVersion = undefined> = {
  /** Determines which task is retained while another task is active. Higher values take precedence. */
  priority?: number
  /** Runs when this task reaches the active position in the queue. */
  run: (context: QueueContext<TVersion>) => Promise<T>
}

export type QueueResult<T> = { status: 'completed'; value: T } | { status: 'superseded' }

export type Queue<TVersion = undefined> = {
  /** Invalidates active task contexts and supersedes pending work. */
  reset: () => void
  /** Adds work to the queue and reports whether it completed or was superseded. */
  schedule: <T>(task: QueueTask<T, TVersion>) => Promise<QueueResult<T>>
}

export type QueueOptions<TVersion> = {
  /** Returns the external version used to determine whether an active task is still current. */
  getVersion: () => TVersion
}

type PendingEntry<TVersion> = {
  priority: number
  reject: (reason: unknown) => void
  resolve: (result: QueueResult<unknown>) => void
  run: (context: QueueContext<TVersion>) => Promise<unknown>
}

export function createQueue(): Queue
export function createQueue<TVersion>(options: QueueOptions<TVersion>): Queue<TVersion>
export function createQueue<TVersion>(
  options?: QueueOptions<TVersion>,
): Queue<TVersion | undefined> {
  const getVersion = options?.getVersion
  let generation = 0
  let isActive = false
  let pending: PendingEntry<TVersion | undefined> | undefined

  const start = (entry: PendingEntry<TVersion | undefined>): void => {
    isActive = true

    const activeGeneration = generation
    const dispatchedVersion = getVersion?.()
    const isGenerationCurrent = () => generation === activeGeneration
    const context: QueueContext<TVersion | undefined> = {
      dispatchedVersion,
      isCurrent: () => isGenerationCurrent() && Object.is(getVersion?.(), dispatchedVersion),
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

  const schedule = <T>(task: QueueTask<T, TVersion | undefined>): Promise<QueueResult<T>> => {
    let resolve!: (result: QueueResult<T>) => void
    let reject!: (reason: unknown) => void
    const result = new Promise<QueueResult<T>>((resolvePromise, rejectPromise) => {
      resolve = resolvePromise
      reject = rejectPromise
    })
    const entry: PendingEntry<TVersion | undefined> = {
      priority: task.priority ?? 0,
      reject,
      resolve: resolve as (result: QueueResult<unknown>) => void,
      run: task.run as (context: QueueContext<TVersion | undefined>) => Promise<unknown>,
    }

    if (!isActive) {
      start(entry)
      return result
    }

    if (!pending || entry.priority >= pending.priority) {
      pending?.resolve({ status: 'superseded' })
      pending = entry
    } else {
      resolve({ status: 'superseded' })
    }

    return result
  }

  return { reset, schedule }
}
