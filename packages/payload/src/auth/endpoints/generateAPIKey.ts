import { status as httpStatus } from 'http-status'

import type { PayloadHandler } from '../../config/types.js'

import { updateByIDOperation } from '../../collections/operations/updateByID.js'
import { Forbidden } from '../../errors/Forbidden.js'
import { getRequestCollectionWithID } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { generateAPIKey } from '../apiKeys/hash.js'
import { wasAPIKeyStored } from '../apiKeys/reveal.js'

/**
 * Issues a new API key for one document and returns it, the only time the raw value is
 * ever visible - only its one-way hash is stored, so it cannot be looked up again.
 *
 * Access control is not re-implemented here: the write goes through the normal update
 * operation with `overrideAccess: false`, so the collection's `update` access and any
 * field-level access on `apiKey` and `enableAPIKey` apply exactly as they do to a save
 * from the Admin Panel. Field-level access is checked again against the result, so a
 * caller whose write was stripped gets an error rather than a key that does not work.
 */
export const generateAPIKeyHandler: PayloadHandler = async (req) => {
  const { id, collection } = getRequestCollectionWithID(req)

  const rawAPIKey = generateAPIKey()

  const doc = await updateByIDOperation({
    id,
    collection,
    data: {
      apiKey: rawAPIKey,
      // Generating a key implies turning API keys on: a key stored against a document with
      // `enableAPIKey: false` would be cleared on the next write and never authenticate.
      enableAPIKey: true,
    },
    overrideAccess: false,
    req,
  })

  if (!wasAPIKeyStored({ rawAPIKey, req })) {
    throw new Forbidden(req.t)
  }

  return Response.json(
    {
      apiKey: rawAPIKey,
      doc,
      message: req.t('authentication:newAPIKeyGenerated'),
    },
    {
      headers: headersWithCors({
        headers: new Headers(),
        req,
      }),
      status: httpStatus.OK,
    },
  )
}
