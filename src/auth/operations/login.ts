import jwt from 'jsonwebtoken';
import { AuthenticationError, LockedAuth } from '../../errors';
import getCookieExpiration from '../../utilities/getCookieExpiration';
import isLocked from '../isLocked';
import removeInternalFields from '../../utilities/removeInternalFields';
import { BeforeLoginHook, BeforeOperationHook } from '../../collections/config/types';

async function login(incomingArgs) {
  const { config, operations, secret } = this;

  let args = incomingArgs;

  // /////////////////////////////////////
  // beforeOperation - Collection
  // /////////////////////////////////////

  await args.collection.config.hooks.beforeOperation.reduce(async (priorHook: BeforeOperationHook, hook: BeforeOperationHook) => {
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
    req,
    depth,
    overrideAccess,
    showHiddenFields,
  } = args;

  // /////////////////////////////////////
  // Login
  // /////////////////////////////////////

  const { email: unsanitizedEmail, password } = data;

  const email = unsanitizedEmail ? unsanitizedEmail.toLowerCase() : null;

  const userDoc = await Model.findByUsername(email);

  if (!userDoc || (args.collection.config.auth.verify && userDoc._verified === false)) {
    throw new AuthenticationError();
  }

  if (userDoc && isLocked(userDoc.lockUntil)) {
    throw new LockedAuth();
  }

  const authResult = await userDoc.authenticate(password);

  const maxLoginAttemptsEnabled = args.collection.config.auth.maxLoginAttempts > 0;

  if (!authResult.user) {
    if (maxLoginAttemptsEnabled) await userDoc.incLoginAttempts();
    throw new AuthenticationError();
  }

  if (maxLoginAttemptsEnabled) {
    await operations.collections.auth.unlock({
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
  user = removeInternalFields(user);
  user = JSON.parse(JSON.stringify(user));

  const fieldsToSign = collectionConfig.fields.reduce((signedFields, field) => {
    const result = {
      ...signedFields,
    };

    if (!field.name && field.fields) {
      field.fields.forEach((subField) => {
        if (subField.saveToJWT) {
          result[subField.name] = user[subField.name];
        }
      });
    }

    if (field.saveToJWT) {
      result[field.name] = user[field.name];
    }

    return result;
  }, {
    email,
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
      doc: user,
      req: args.req,
      token,
    }) || user;
  }, Promise.resolve());

  // /////////////////////////////////////
  // afterRead - Fields
  // /////////////////////////////////////

  user = await this.performFieldOperations(collectionConfig, {
    depth,
    req,
    data: user,
    hook: 'afterRead',
    operation: 'login',
    overrideAccess,
    reduceLocales: true,
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
    exp: jwt.decode(token).exp,
  };
}

export default login;
