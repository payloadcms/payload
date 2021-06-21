import { Preference, PreferenceRequest } from '../types';
import executeAccess from '../../auth/executeAccess';
import defaultAccess from '../../auth/defaultAccess';
import UnauthorizedError from '../../errors/UnathorizedError';

async function findOne(args: PreferenceRequest): Promise<Preference> {
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

  const doc = await Model.findOne(filter);

  if (!doc) return null;

  return doc;
}

export default findOne;
