import { DeleteWriteOpResultObject } from 'mongodb';
import executeAccess from '../../auth/executeAccess';
import defaultAccess from '../../auth/defaultAccess';
import UnauthorizedError from '../../errors/UnathorizedError';
import { NotFound } from '../../errors';
import { PreferenceRequest } from '../types';

async function handleDelete(args: PreferenceRequest): Promise<DeleteWriteOpResultObject> {
  const { preferences: { Model } } = this;
  const {
    overrideAccess,
    req,
    user,
    key,
  } = args;

  if (!user) {
    throw new UnauthorizedError();
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

  if (result.deletedCount === 0) {
    throw new NotFound();
  }

  return result;
}

export default handleDelete;
