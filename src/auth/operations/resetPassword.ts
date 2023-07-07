import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { Collection } from '../../collections/config/types';
import { APIError } from '../../errors';
import getCookieExpiration from '../../utilities/getCookieExpiration';
import { fieldAffectsData } from '../../fields/config/types';
import { PayloadRequest } from '../../express/types';
import { authenticateLocalStrategy } from '../strategies/local/authenticate';
import { generatePasswordSaltHash } from '../strategies/local/generatePasswordSaltHash';

export type Result = {
  token: string
  user: Record<string, unknown>
}

export type Arguments = {
  data: {
    token: string
    password: string
  }
  collection: Collection
  req: PayloadRequest
  overrideAccess?: boolean
  res?: Response
  depth?: number
}

async function resetPassword(args: Arguments): Promise<Result> {
  if (!Object.prototype.hasOwnProperty.call(args.data, 'token')
    || !Object.prototype.hasOwnProperty.call(args.data, 'password')) {
    throw new APIError('Missing required data.');
  }

  const {
    collection: {
      config: collectionConfig,
    },
    req: {
      payload: {
        config,
        secret,
      },
      payload,
    },
    overrideAccess,
    data,
    depth,
  } = args;

  // /////////////////////////////////////
  // Reset Password
  // /////////////////////////////////////

  const user = await payload.db.findOne<any>({
    collection: collectionConfig.slug,
    where: {
      resetPasswordToken: { equals: data.token },
      resetPasswordExpiration: { greater_than: Date.now() },
    },
  });

  if (!user) throw new APIError('Token is either invalid or has expired.');

  // TODO: replace this method
  const { salt, hash } = await generatePasswordSaltHash({ password: data.password });

  user.salt = salt;
  user.hash = hash;

  user.resetPasswordExpiration = Date.now();

  if (collectionConfig.auth.verify) {
    user._verified = true;
  }

  const doc = await payload.db.updateOne({
    collection: collectionConfig.slug,
    where: { id: { equals: user.id } },
    data: user,
  });


  await authenticateLocalStrategy({ password: data.password, doc });

  const fieldsToSign = collectionConfig.fields.reduce((signedFields, field) => {
    if (fieldAffectsData(field) && field.saveToJWT) {
      return {
        ...signedFields,
        [field.name]: user[field.name],
      };
    }
    return signedFields;
  }, {
    email: user.email,
    id: user.id,
    collection: collectionConfig.slug,
  });

  const token = jwt.sign(
    fieldsToSign,
    secret,
    {
      expiresIn: collectionConfig.auth.tokenExpiration,
    },
  );

  if (args.res) {
    const cookieOptions = {
      path: '/',
      httpOnly: true,
      expires: getCookieExpiration(collectionConfig.auth.tokenExpiration),
      secure: collectionConfig.auth.cookies.secure,
      sameSite: collectionConfig.auth.cookies.sameSite,
      domain: undefined,
    };


    if (collectionConfig.auth.cookies.domain) cookieOptions.domain = collectionConfig.auth.cookies.domain;

    args.res.cookie(`${config.cookiePrefix}-token`, token, cookieOptions);
  }

  const fullUser = await payload.findByID({ collection: collectionConfig.slug, id: user.id, overrideAccess, depth });
  return { token, user: fullUser };
}

export default resetPassword;
