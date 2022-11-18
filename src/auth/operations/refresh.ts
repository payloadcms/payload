import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { Collection, BeforeOperationHook } from '../../collections/config/types';
import { Forbidden } from '../../errors';
import getCookieExpiration from '../../utilities/getCookieExpiration';
import { Document } from '../../types';
import { PayloadRequest } from '../../express/types';

export type Result = {
  exp: number,
  user: Document,
  refreshedToken: string
}

export type Arguments = {
  collection: Collection,
  token: string
  req: PayloadRequest
  res?: Response
}

async function refresh(incomingArgs: Arguments): Promise<Result> {
  let args = incomingArgs;

  // /////////////////////////////////////
  // beforeOperation - Collection
  // /////////////////////////////////////

  await args.collection.config.hooks.beforeOperation.reduce(async (priorHook: BeforeOperationHook | Promise<void>, hook: BeforeOperationHook) => {
    await priorHook;

    args = (await hook({
      args,
      operation: 'refresh',
    })) || args;
  }, Promise.resolve());

  // /////////////////////////////////////
  // Refresh
  // /////////////////////////////////////

  const {
    collection: {
      config: collectionConfig,
    },
    req: {
      payload: {
        secret,
        config,
      },
    },
  } = args;

  const opts = {
    expiresIn: args.collection.config.auth.tokenExpiration,
  };

  if (typeof args.token !== 'string') throw new Forbidden(args.req.t);

  const payload = jwt.verify(args.token, secret, {}) as Record<string, unknown>;
  delete payload.iat;
  delete payload.exp;
  const refreshedToken = jwt.sign(payload, secret, opts);
  const exp = (jwt.decode(refreshedToken) as Record<string, unknown>).exp as number;

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

    args.res.cookie(`${config.cookiePrefix}-token`, refreshedToken, cookieOptions);
  }

  // /////////////////////////////////////
  // After Refresh - Collection
  // /////////////////////////////////////

  await collectionConfig.hooks.afterRefresh.reduce(async (priorHook, hook) => {
    await priorHook;

    args = (await hook({
      req: args.req,
      res: args.res,
      exp,
      token: refreshedToken,
    })) || args;
  }, Promise.resolve());

  // /////////////////////////////////////
  // Return results
  // /////////////////////////////////////

  return {
    refreshedToken,
    exp,
    user: payload,
  };
}

export default refresh;
