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

  const collection = '_preferences';

  const filter = {
    key,
    user: {
      value: user.id,
      relationTo: user.collection,
    },
  };

  const preference = {
    ...filter,
    value,
  };

  if (!user) {
    throw new UnauthorizedError(req.t);
  }

  if (!overrideAccess) {
    await executeAccess({ req }, defaultAccess);
  }

  const { Model } = payload.collections[collection];
  const updateResult = await Model.updateOne(filter, preference);
  if (updateResult.modifiedCount === 0) {
    // TODO: workaround to prevent race-conditions 500 errors from violating unique constraints
    try {
      await Model.create(preference);
    } catch (err: unknown) {
      await Model.updateOne(filter, preference);
    }
  }
  return preference;
}

export default update;
