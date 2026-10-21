import type { PayloadRequest } from '../../../types/index.js'
import type { BranchContentScope, BranchHeadID } from '../types.js'
import type { BranchProjectionControl, BranchProjectionGuard } from './branchProjectionGuard.js'

import { createBranchReadRequest } from '../../../utilities/createBranchReadRequest.js'
import { getBranchKey } from '../storage/branchStorage.js'
import { captureBranchProjectionGuard } from './branchProjectionGuard.js'

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
  const frame = frames.get(req.payload.db)

  if (!frame) {
    return captureBranchProjectionGuard({ branchID, control, req, scopes })
  }
  const coordinate = (scope: BranchContentScope) =>
    JSON.stringify([getBranchKey({ branchID }), control.states, control.invalidations, scope])
  const missing = scopes.filter((scope) => !frame.has(coordinate(scope)))

  if (missing.length) {
    const captured = captureBranchProjectionGuard({ branchID, control, req, scopes: missing })

    for (const scope of missing) {
      frame.set(coordinate(scope), captured)
    }
  }
  const guards = await Promise.all(scopes.map((scope) => frame.get(coordinate(scope))!))
  const observations = new Map(
    guards
      .flatMap((guard) => guard.observations)
      .map((observation) => [observation.id, observation]),
  )

  return { control, observations: [...observations.values()] }
}
