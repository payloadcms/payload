import { PreferenceUpdateRequest } from '../types';
import defaultAccess from '../../auth/defaultAccess';
import executeAccess from '../../auth/executeAccess';
import UnauthorizedError from '../../errors/UnathorizedError';

async function update(args: PreferenceUpdateRequest) {
  const {
    overrideAccess,
    user,
    req,
    req: {
      payload,
    },
    key,
    value,
  } = args;

  const collection = 'payload-preferences';

  const filter = {
    key: { equals: key },
    'user.value': { equals: user.id },
    'user.relationTo': { equals: user.collection },
  };

  const preference = {
    key,
    value,
    user: {
      value: user.id,
      relationTo: user.collection,
    },
  };

  if (!user) {
    throw new UnauthorizedError(req.t);
  }

  if (!overrideAccess) {
    await executeAccess({ req }, defaultAccess);
  }

  // TODO: workaround to prevent race-conditions 500 errors from violating unique constraints
  try {
    await payload.db.create({
      collection,
      data: preference,
    });
  } catch (err: unknown) {
    await payload.db.updateOne({
      collection,
      where: filter,
      data: preference,
    });
  }

  return preference;
}

export default update;
