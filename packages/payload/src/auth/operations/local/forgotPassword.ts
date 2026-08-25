import type { AuthCollectionSlug, Payload, RequestContext } from '../../../index.js'
import type { PayloadRequest } from '../../../types/index.js'
import type { Result } from '../forgotPassword.js'

import { APIError } from '../../../errors/index.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { warnMissingOverrideAccess } from '../../../utilities/warnMissingOverrideAccess.js'
import { forgotPasswordOperation } from '../forgotPassword.js'

export type Options<TSlug extends AuthCollectionSlug> = {
  collection: TSlug
  context?: RequestContext
  data: {
    email: string
  }
  disableEmail?: boolean
  expiration?: number
  /**
   * Whether to skip access control for this operation.
   *
   * `false` respects Access Control — use this whenever the operation acts on behalf of a
   * user, such as fetching data for the front-end.
   * `true` bypasses it — use this for trusted server-side work such as cron jobs, seeding,
   * and migrations.
   *
   * Required. Omitting it used to skip access control silently.
   */
  overrideAccess: boolean
  req?: Partial<PayloadRequest>
}

export async function forgotPasswordLocal<T extends AuthCollectionSlug>(
  payload: Payload,
  options: Options<T>,
): Promise<Result> {
  const {
    collection: collectionSlug,
    data,
    disableEmail,
    expiration,
    overrideAccess: overrideAccessFromOptions,
  } = options

  // An untyped caller — plain JavaScript, an `as any` cast, or a plugin whose JavaScript was
  // compiled against Payload 3 — can still omit this. Coerce once, here, so nothing further
  // in has to decide what a missing value means. `false` enforces access control, so the
  // failure mode is a missing document rather than a leaked one.
  if (overrideAccessFromOptions === undefined) {
    warnMissingOverrideAccess({ operation: 'payload.forgotPassword', payload })
  }

  const overrideAccess = overrideAccessFromOptions ?? false

  const collection = payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(
        collectionSlug,
      )} can't be found. Forgot Password Operation.`,
    )
  }

  return forgotPasswordOperation({
    collection,
    data,
    disableEmail,
    expiration,
    overrideAccess,
    req: await createLocalReq(options, payload),
  }) as Promise<Result>
}
