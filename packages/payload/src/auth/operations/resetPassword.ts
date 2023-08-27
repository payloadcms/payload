import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { Collection } from '../../collections/config/types.js';
import { APIError } from '../../errors/index.js';
import getCookieExpiration from '../../utilities/getCookieExpiration.js';
import { getFieldsToSign } from './getFieldsToSign.js';
import { PayloadRequest } from '../../express/types.js';
import { authenticateLocalStrategy } from '../strategies/local/authenticate.js';
import { generatePasswordSaltHash } from '../strategies/local/generatePasswordSaltHash.js';
import { initTransaction } from '../../utilities/initTransaction.js';
import { killTransaction } from '../../utilities/killTransaction.js';

export type Result = {
  token?: string
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
    req,
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

  try {
    const shouldCommit = await initTransaction(req);

    // /////////////////////////////////////
    // Reset Password
    // /////////////////////////////////////

    const user = await payload.db.findOne<any>({
      collection: collectionConfig.slug,
      where: {
        resetPasswordToken: { equals: data.token },
        resetPasswordExpiration: { greater_than: Date.now() },
      },
      req,
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
      id: user.id,
      data: user,
      req,
    });


    await authenticateLocalStrategy({ password: data.password, doc });

    const fieldsToSign = getFieldsToSign({
      collectionConfig,
      user,
      email: user.email,
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

    const fullUser = await payload.findByID({ collection: collectionConfig.slug, id: user.id, overrideAccess, depth, req });
    if (shouldCommit) await payload.db.commitTransaction(req.transactionID);

    return {
      token: collectionConfig.auth.removeTokenFromResponses ? undefined : token,
      user: fullUser,
    };
  } catch (error: unknown) {
    await killTransaction(req);
    throw error;
  }
}

export default resetPassword;
