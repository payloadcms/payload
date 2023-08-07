import httpStatus from 'http-status';
import { APIError } from '../../errors';
import { Collection } from '../../collections/config/types';

export type Args = {
  token: string
  collection: Collection
}

async function verifyEmail(args: Args): Promise<boolean> {
  if (!Object.prototype.hasOwnProperty.call(args, 'token')) {
    throw new APIError('Missing required data.', httpStatus.BAD_REQUEST);
  }

  const user = await args.collection.Model.findOne({
    _verificationToken: args.token,
  });

  if (!user) throw new APIError('Verification token is invalid.', httpStatus.BAD_REQUEST);
  if (user && user._verified === true) throw new APIError('This account has already been activated.', httpStatus.ACCEPTED);

  user._verified = true;
  user._verificationToken = undefined;

  await user.save();
  return true;
}

export default verifyEmail;
