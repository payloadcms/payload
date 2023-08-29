import type { Document, Where } from '../../types/index.js';
import type { PreferenceRequest } from '../types.js';

import defaultAccess from '../../auth/defaultAccess.js';
import executeAccess from '../../auth/executeAccess.js';
import NotFound from '../../errors/NotFound.js';
import UnauthorizedError from '../../errors/UnathorizedError.js';

async function deleteOperation(args: PreferenceRequest): Promise<Document> {
  const {
    key,
    overrideAccess,
    req: {
      payload,
    },
    req,
    user,
  } = args;

  if (!user) {
    throw new UnauthorizedError(req.t);
  }

  if (!overrideAccess) {
    await executeAccess({ req }, defaultAccess);
  }

  const where: Where = {
    and: [
      { key: { equals: key } },
      { 'user.value': { equals: user.id } },
      { 'user.relationTo': { equals: user.collection } },
    ],
  };

  const result = await payload.delete({
    collection: 'payload-preferences',
    depth: 0,
    user,
    where,
  });

  if (result.docs.length === 1) {
    return result.docs[0];
  }
  throw new NotFound();
}

export default deleteOperation;
