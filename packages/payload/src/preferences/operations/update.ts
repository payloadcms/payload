import { Preference, PreferenceUpdateRequest } from '../types';
import defaultAccess from '../../auth/defaultAccess';
import executeAccess from '../../auth/executeAccess';
import UnauthorizedError from '../../errors/UnathorizedError';

async function update(args: PreferenceUpdateRequest) {
  const {
    overrideAccess,
    user,
    req,
    req: {
      payload: {
        preferences: {
          Model,
        },
      },
    },
    key,
    value,
  } = args;

  if (!user) {
    throw new UnauthorizedError(req.t);
  }

  if (!overrideAccess) {
    await executeAccess({ req }, defaultAccess);
  }

  const filter = { user: user.id, key, userCollection: user.collection };
  const preference: Preference = { ...filter, value };
  await Model.updateOne(filter, { ...preference }, { upsert: true });

  return preference;
}

export default update;
