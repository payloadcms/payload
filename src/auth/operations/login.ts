import jwt from 'jsonwebtoken';
import { Config as GeneratedTypes } from 'payload/generated-types';
import { CookieOptions, Response } from 'express';
import { AuthenticationError, LockedAuth } from '../../errors';
import { PayloadRequest } from '../../express/types';
import getCookieExpiration from '../../utilities/getCookieExpiration';
import isLocked from '../isLocked';
import sanitizeInternalFields from '../../utilities/sanitizeInternalFields';
import { Field, fieldHasSubFields, fieldAffectsData } from '../../fields/config/types';
import { User } from '../types';
import { Collection } from '../../collections/config/types';
import { afterRead } from '../../fields/hooks/afterRead';
import unlock from './unlock';

export type Result = {
  user?: User,
  token?: string,
  exp?: number,
}

export type Arguments = {
  collection: Collection,
  data: {
    email: string
    password: string
  }
  req: PayloadRequest
  res?: Response
  depth?: number
  overrideAccess?: boolean
  showHiddenFields?: boolean
}

async function login<TSlug extends keyof GeneratedTypes['collections']>(
  incomingArgs: Arguments,
): Promise<Result & { user: GeneratedTypes['collections'][TSlug] }> {
  let args = incomingArgs;

  // /////////////////////////////////////
  // beforeOperation - Collection
  // /////////////////////////////////////

  await args.collection.config.hooks.beforeOperation.reduce(async (priorHook, hook) => {
    await priorHook;

    args = (await hook({
      args,
      operation: 'login',
    })) || args;
  }, Promise.resolve());

  const {
    collection: {
      Model,
      config: collectionConfig,
    },
    data,
    req: {
      payload: {
        secret,
        config,
      },
    },
    req,
    depth,
    overrideAccess,
    showHiddenFields,
  } = args;

  // /////////////////////////////////////
  // Login
  // /////////////////////////////////////

  const { email: unsanitizedEmail, password } = data;

  const email = unsanitizedEmail ? (unsanitizedEmail as string).toLowerCase().trim() : null;

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore Improper typing in library, additional args should be optional
  const userDoc = await Model.findByUsername(email);

  if (!userDoc || (args.collection.config.auth.verify && userDoc._verified === false)) {
    throw new AuthenticationError(req.t);
  }

  if (userDoc && isLocked(userDoc.lockUntil)) {
    throw new LockedAuth(req.t);
  }

  const authResult = await userDoc.authenticate(password);

  const maxLoginAttemptsEnabled = args.collection.config.auth.maxLoginAttempts > 0;

  if (!authResult.user) {
    if (maxLoginAttemptsEnabled) await userDoc.incLoginAttempts();
    throw new AuthenticationError(req.t);
  }

  if (maxLoginAttemptsEnabled) {
    await unlock({
      collection: {
        Model,
        config: collectionConfig,
      },
      req,
      data,
      overrideAccess: true,
    });
  }

  let user = userDoc.toJSON({ virtuals: true });
  user = JSON.parse(JSON.stringify(user));
  user = sanitizeInternalFields(user);

  const fieldsToSign = collectionConfig.fields.reduce((signedFields, field: Field) => {
    const result = {
      ...signedFields,
    };

    if (!fieldAffectsData(field) && fieldHasSubFields(field)) {
      field.fields.forEach((subField) => {
        if (fieldAffectsData(subField) && subField.saveToJWT) {
          result[subField.name] = user[subField.name];
        }
      });
    }

    if (fieldAffectsData(field) && field.saveToJWT) {
      result[field.name] = user[field.name];
    }

    return result;
  }, {
    email,
    id: user.id,
    collection: collectionConfig.slug,
  });

  await collectionConfig.hooks.beforeLogin.reduce(async (priorHook, hook) => {
    await priorHook;

    user = (await hook({
      user,
      req: args.req,
    })) || user;
  }, Promise.resolve());

  const token = jwt.sign(
    fieldsToSign,
    secret,
    {
      expiresIn: collectionConfig.auth.tokenExpiration,
    },
  );

  if (args.res) {
    const cookieOptions: CookieOptions = {
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

  req.user = user;

  // /////////////////////////////////////
  // afterLogin - Collection
  // /////////////////////////////////////

  await collectionConfig.hooks.afterLogin.reduce(async (priorHook, hook) => {
    await priorHook;

    user = await hook({
      user,
      req: args.req,
      token,
    }) || user;
  }, Promise.resolve());

  // /////////////////////////////////////
  // afterRead - Fields
  // /////////////////////////////////////

  user = await afterRead({
    depth,
    doc: user,
    entityConfig: collectionConfig,
    overrideAccess,
    req,
    showHiddenFields,
  });

  // /////////////////////////////////////
  // afterRead - Collection
  // /////////////////////////////////////

  await collectionConfig.hooks.afterRead.reduce(async (priorHook, hook) => {
    await priorHook;

    user = await hook({
      req,
      doc: user,
    }) || user;
  }, Promise.resolve());

  // /////////////////////////////////////
  // Return results
  // /////////////////////////////////////

  return {
    token,
    user,
    exp: (jwt.decode(token) as jwt.JwtPayload).exp,
  };
}

export default login;
