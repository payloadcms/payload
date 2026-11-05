import type { AuthSessionRefreshBarrierPhase } from './shared.js'

type RefreshBarrier = {
  enteredCount: number
  isReleased: boolean
  phase: AuthSessionRefreshBarrierPhase
  release: () => void
  wait: Promise<void>
}

/**
 * Pauses provider refresh at a selected phase so E2E tests can deterministically overlap refresh
 * with logout, revocation, or another tab's request.
 */
export function createProviderRefreshBarrier() {
  let barrier: RefreshBarrier | undefined

  const release = (): void => {
    if (barrier && !barrier.isReleased) {
      barrier.isReleased = true
      barrier.release()
    }
  }

  return {
    arm({ phase }: { phase: AuthSessionRefreshBarrierPhase }): void {
      release()

      let releaseWait: () => void = () => undefined
      const wait = new Promise<void>((resolve) => {
        releaseWait = resolve
      })

      barrier = {
        enteredCount: 0,
        isReleased: false,
        phase,
        release: releaseWait,
        wait,
      }
    },
    read(): Pick<RefreshBarrier, 'enteredCount' | 'isReleased' | 'phase'> | undefined {
      if (!barrier) {
        return
      }

      return {
        enteredCount: barrier.enteredCount,
        isReleased: barrier.isReleased,
        phase: barrier.phase,
      }
    },
    release,
    reset(): void {
      release()
      barrier = undefined
    },
    async wait({ phase }: { phase: AuthSessionRefreshBarrierPhase }): Promise<void> {
      const currentBarrier = barrier

      if (!currentBarrier || currentBarrier.phase !== phase || currentBarrier.isReleased) {
        return
      }

      currentBarrier.enteredCount += 1
      await currentBarrier.wait
    },
  }
}
