import type { PayloadRequest } from '../../../types/index.js'
import type { BranchContentScope, BranchHeadID } from '../types.js'
import type { BranchProjectionControl, BranchProjectionGuard } from './branchProjectionGuard.js'

import { createBranchReadRequest } from '../../../utilities/createBranchReadRequest.js'
import { getBranchKey } from '../storage/branchStorage.js'
import {
  captureBranchProjectionGuard,
  captureBranchProjectionGuards,
} from './branchProjectionGuard.js'

type Frame = Map<string, Promise<BranchProjectionGuard>>
const frames = new WeakMap<object, Frame>()

/** A frame exists only while an adapter-verified snapshot (or final atomic trace validation) owns the read. */
export const withBranchReadSnapshot = async <T>({
  locale,
  read,
  req,
}: {
  locale?: string
  read: (args: { req: PayloadRequest }) => Promise<T>
  req: PayloadRequest
}): Promise<T> => {
  const snapshot = req.payload.db.branching?.withReadSnapshot

  if (!snapshot) {
    throw Object.assign(new Error('Branch reads require a native consistent raw read boundary.'), {
      code: 'branch-read-snapshot-unsupported',
    })
  }
  return snapshot({
    read: async ({ req: scoped }) => {
      const adapter = scoped.payload.db
      const isOwner = !frames.has(adapter)

      if (isOwner) {
        frames.set(adapter, new Map())
      }
      try {
        const effectiveLocale =
          locale ??
          scoped.locale ??
          (scoped.payload.config?.localization
            ? scoped.payload.config.localization.defaultLocale
            : undefined)
        const queryReq =
          effectiveLocale !== scoped.locale
            ? createBranchReadRequest({
                locale: effectiveLocale,
                payload: scoped.payload,
                req: scoped,
              })
            : scoped

        return await read({ req: queryReq })
      } finally {
        if (isOwner) {
          frames.delete(adapter)
        }
      }
    },
    req,
  })
}

/** Reuse only already observed scope readiness inside the same verified frame. New scopes still read their native guard. */
export const captureBranchReadProjectionGuard = async ({
  branchID,
  control,
  req,
  scopes,
}: {
  branchID: BranchHeadID
  control: BranchProjectionControl
  req: PayloadRequest
  scopes: readonly BranchContentScope[]
}): Promise<BranchProjectionGuard> => {
  return (
    await captureBranchReadProjectionGuards({ branchID, controls: [control], req, scopes })
  )[0]!
}

/** Observe the finite set of reachable controls together when the native snapshot supports it. */
export const captureBranchReadProjectionGuards = async ({
  branchID,
  controls,
  req,
  scopes,
}: {
  branchID: BranchHeadID
  controls: BranchProjectionControl[]
  req: PayloadRequest
  scopes: readonly BranchContentScope[]
}): Promise<BranchProjectionGuard[]> => {
  if (controls.length && !scopes.length) {
    throw new Error('A branch query requires at least its shared projection scope.')
  }
  const frame = frames.get(req.payload.db)

  if (!frame) {
    const guards: BranchProjectionGuard[] = []

    for (const control of controls) {
      guards.push(await captureBranchProjectionGuard({ branchID, control, req, scopes }))
    }
    return guards
  }
  const coordinate = (control: BranchProjectionControl, scope: BranchContentScope) =>
    JSON.stringify([getBranchKey({ branchID }), control.states, control.invalidations, scope])
  const scheduled = new Set<string>()
  const missingReads = controls.flatMap((control) => {
    const missing = scopes.filter((scope) => {
      const key = coordinate(control, scope)

      if (frame.has(key) || scheduled.has(key)) {
        return false
      }
      scheduled.add(key)
      return true
    })

    return missing.length ? [{ control, scopes: missing }] : []
  })

  if (missingReads.length) {
    const captured = captureBranchProjectionGuards({ branchID, reads: missingReads, req })

    missingReads.forEach(({ control, scopes }, index) => {
      const guard = captured.then((guards) => guards[index]!)

      for (const scope of scopes) {
        frame.set(coordinate(control, scope), guard)
      }
    })
  }

  return Promise.all(
    controls.map(async (control) => {
      const guards = await Promise.all(
        scopes.map((scope) => frame.get(coordinate(control, scope))!),
      )
      const observations = new Map(
        guards
          .flatMap((guard) => guard.observations)
          .map((observation) => [observation.id, observation]),
      )

      return { control, observations: [...observations.values()] }
    }),
  )
}
