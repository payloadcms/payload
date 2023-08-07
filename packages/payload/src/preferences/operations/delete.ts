import executeAccess from '../../auth/executeAccess';
import defaultAccess from '../../auth/defaultAccess';
import { Document } from '../../types';
import UnauthorizedError from '../../errors/UnathorizedError';
import { PreferenceRequest } from '../types';

async function deleteOperation(args: PreferenceRequest): Promise<Document> {
  const {
    overrideAccess,
    req,
    req: {
      payload: {
        preferences: {
          Model,
        },
      },
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

  const filter = {
    key,
    user: user.id,
    userCollection: user.collection,
  };

  const result = await Model.findOneAndDelete(filter);

  return result;
}

export default deleteOperation;
