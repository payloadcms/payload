/** The title of a document whose save `holdSlowSave` pauses. */
export const slowSaveTitle = 'Slow save'

let pausedSave: { markReached: () => void; resumed: Promise<void> } | undefined

/**
 * Pauses saves of a document titled `slowSaveTitle` in `beforeChange`, after their file reference
 * was checked, until `release` is called.
 */
export const holdSlowSave = (): { reached: Promise<void>; release: () => void } => {
  let markReached!: () => void
  let release!: () => void

  const reached = new Promise<void>((resolve) => {
    markReached = resolve
  })
  const resumed = new Promise<void>((resolve) => {
    release = resolve
  })

  pausedSave = { markReached, resumed }

  return {
    reached,
    release: () => {
      pausedSave = undefined
      release()
    },
  }
}

export const waitWhileSaveIsHeld = async (): Promise<void> => {
  if (pausedSave) {
    pausedSave.markReached()
    await pausedSave.resumed
  }
}
