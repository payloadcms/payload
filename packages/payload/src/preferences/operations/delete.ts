import executeAccess from '../../auth/executeAccess.js';
import defaultAccess from '../../auth/defaultAccess.js';
import { Document, Where } from '../../types/index.js';
import UnauthorizedError from '../../errors/UnathorizedError.js';
import { PreferenceRequest } from '../types.js';
import NotFound from '../../errors/NotFound.js';

async function deleteOperation(args: PreferenceRequest): Promise<Document> {
  const {
    overrideAccess,
    req,
    req: {
      payload,
    },
    user,
    key,
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
    where,
    depth: 0,
    user,
  });

  if (result.docs.length === 1) {
    return result.docs[0];
  }
  throw new NotFound();
}

export default deleteOperation;
