import type { PayloadRequest } from '../../../types/index.js'
import type { BranchHeadID } from '../types.js'

import { withBranchReadSnapshot } from './withBranchReadSnapshot.js'

type RawDocument = Record<string, unknown>
type Coordinate = { collection: string; id: number | string }
type RememberArgs = { doc: null | RawDocument } & Coordinate

export type BranchRawReadGraph = {
  /** Unknown keys fail closed. An explicit null is an authorized negative lookup. */
  get: (args: Coordinate) => null | RawDocument
}

/**
 * Collect every raw population read inside the adapter snapshot, before field or
 * document hooks. A graph is operation-local: branch, locale/fallback and access
 * context cannot leak into another request's loader cache. Callers must record
 * missing/denied targets as null and must not fall back to database reads later.
 */
export const collectBranchReadGraph = async <T>({
  branchID,
  locale,
  read,
  req,
}: {
  branchID: BranchHeadID
  locale?: string
  read: (args: {
    remember: (args: RememberArgs) => void
    /** Transfer a fresh native row which is never exposed outside this collection callback. */
    rememberOwned: (args: RememberArgs) => void
    req: PayloadRequest
  }) => Promise<T>
  req: PayloadRequest
}): Promise<{ graph: BranchRawReadGraph; result: T }> => {
  const rows = new Map<string, null | RawDocument>()
  const encoder = new TextEncoder()
  let bytes = 0
  let isCollecting = true
  const key = ({ id, collection }: Coordinate): string =>
    JSON.stringify([branchID, collection, typeof id, id])
  const store = ({
    id,
    collection,
    doc,
    shouldClone,
  }: { shouldClone: boolean } & RememberArgs): void => {
    if (!isCollecting) {
      throw unsupported()
    }
    const coordinate = key({ id, collection })
    if (rows.has(coordinate)) {
      // Reading the same target more than once is allowed only when its complete
      // raw result agrees. This catches accidental inconsistent callback wiring.
      if (JSON.stringify(rows.get(coordinate)) !== JSON.stringify(doc)) {
        throw unsupported()
      }
      return
    }

    const nextBytes =
      encoder.encode(coordinate).byteLength + encoder.encode(JSON.stringify(doc)).byteLength
    if (rows.size >= 10_000 || bytes + nextBytes > 16 * 1024 * 1024) {
      throw unsupported()
    }
    const stored = shouldClone ? structuredClone(doc) : doc
    bytes += nextBytes
    rows.set(coordinate, stored)
  }

  try {
    const result = await withBranchReadSnapshot({
      locale,
      read: ({ req: snapshotReq }) =>
        read({
          remember: (args) => store({ ...args, shouldClone: true }),
          rememberOwned: (args) => store({ ...args, shouldClone: false }),
          req: snapshotReq,
        }),
      req,
    })

    isCollecting = false
    return {
      graph: {
        get: ({ id, collection }) => {
          const coordinate = key({ id, collection })

          if (!rows.has(coordinate)) {
            throw unsupported()
          }
          return structuredClone(rows.get(coordinate)!)
        },
      },
      result,
    }
  } finally {
    isCollecting = false
  }
}

const unsupported = (): Error =>
  Object.assign(
    new Error(
      'The branch population graph is incomplete or exceeds its supported snapshot budget.',
    ),
    { code: 'branch-read-snapshot-unsupported' },
  )
