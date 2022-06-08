import crypto from 'crypto';

import executeAccess from '../../auth/executeAccess';
import sanitizeInternalFields from '../../utilities/sanitizeInternalFields';

import { ValidationError } from '../../errors';

import sendVerificationEmail from '../../auth/sendVerificationEmail';
import { AfterChangeHook, BeforeOperationHook, BeforeValidateHook, Collection } from '../config/types';
import { PayloadRequest } from '../../express/types';
import { Document } from '../../types';
import { fieldAffectsData } from '../../fields/config/types';
import uploadFile from '../../uploads/uploadFile';
import { beforeChange } from '../../fields/hooks/beforeChange';
import { beforeValidate } from '../../fields/hooks/beforeValidate';
import { afterChange } from '../../fields/hooks/afterChange';
import { afterRead } from '../../fields/hooks/afterRead';

export type Arguments = {
  collection: Collection
  req: PayloadRequest
  depth?: number
  disableVerificationEmail?: boolean
  overrideAccess?: boolean
  showHiddenFields?: boolean
  data: Record<string, unknown>
  overwriteExistingFiles?: boolean
  draft?: boolean
}

async function create(incomingArgs: Arguments): Promise<Document> {
  let args = incomingArgs;

  // /////////////////////////////////////
  // beforeOperation - Collection
  // /////////////////////////////////////

  await args.collection.config.hooks.beforeOperation.reduce(async (priorHook: BeforeOperationHook | Promise<void>, hook: BeforeOperationHook) => {
    await priorHook;

    args = (await hook({
      args,
      operation: 'create',
    })) || args;
  }, Promise.resolve());

  const {
    collection,
    collection: {
      Model,
      config: collectionConfig,
    },
    req,
    req: {
      payload,
      payload: {
        config,
        emailOptions,
      },
    },
    disableVerificationEmail,
    depth,
    overrideAccess,
    showHiddenFields,
    overwriteExistingFiles = false,
    draft = false,
  } = args;

  let { data } = args;

  const shouldSaveDraft = Boolean(draft && collectionConfig.versions.drafts);

  // /////////////////////////////////////
  // Access
  // /////////////////////////////////////

  if (!overrideAccess) {
    await executeAccess({ req, data }, collectionConfig.access.create);
  }

  // /////////////////////////////////////
  // Custom id
  // /////////////////////////////////////

  const hasIdField = collectionConfig.fields.findIndex((field) => fieldAffectsData(field) && field.name === 'id') > -1;
  if (hasIdField) {
    data = {
      _id: data.id,
      ...data,
    };
  }

  // /////////////////////////////////////
  // Upload and resize potential files
  // /////////////////////////////////////

  data = await uploadFile({
    config,
    collection,
    req,
    data,
    throwOnMissingFile: !shouldSaveDraft,
    overwriteExistingFiles,
  });

  // /////////////////////////////////////
  // beforeValidate - Fields
  // /////////////////////////////////////

  data = await beforeValidate({
    data,
    doc: {},
    entityConfig: collectionConfig,
    operation: 'create',
    overrideAccess,
    req,
  });

  // /////////////////////////////////////
  // beforeValidate - Collections
  // /////////////////////////////////////

  await collectionConfig.hooks.beforeValidate.reduce(async (priorHook: BeforeValidateHook | Promise<void>, hook: BeforeValidateHook) => {
    await priorHook;

    data = (await hook({
      data,
      req,
      operation: 'create',
    })) || data;
  }, Promise.resolve());

  // /////////////////////////////////////
  // beforeChange - Collection
  // /////////////////////////////////////

  await collectionConfig.hooks.beforeChange.reduce(async (priorHook, hook) => {
    await priorHook;

    data = (await hook({
      data,
      req,
      operation: 'create',
    })) || data;
  }, Promise.resolve());

  // /////////////////////////////////////
  // beforeChange - Fields
  // /////////////////////////////////////

  const resultWithLocales = await beforeChange({
    data,
    doc: {},
    docWithLocales: {},
    entityConfig: collectionConfig,
    operation: 'create',
    req,
    skipValidation: shouldSaveDraft,
  });

  // /////////////////////////////////////
  // Create
  // /////////////////////////////////////

  let doc;

  if (collectionConfig.auth) {
    if (data.email) {
      resultWithLocales.email = (data.email as string).toLowerCase();
    }
    if (collectionConfig.auth.verify) {
      resultWithLocales._verified = false;
      resultWithLocales._verificationToken = crypto.randomBytes(20).toString('hex');
    }

    try {
      doc = await Model.register(resultWithLocales, data.password as string);
    } catch (error) {
      // Handle user already exists from passport-local-mongoose
      if (error.name === 'UserExistsError') {
        throw new ValidationError([{ message: error.message, field: 'email' }]);
      }
      throw error;
    }
  } else {
    try {
      doc = await Model.create(resultWithLocales);
    } catch (error) {
      // Handle uniqueness error from MongoDB
      throw error.code === 11000
        ? new ValidationError([{ message: 'Value must be unique', field: Object.keys(error.keyValue)[0] }])
        : error;
    }
  }

  let result: Document = doc.toJSON({ virtuals: true });
  const verificationToken = result._verificationToken;

  // custom id type reset
  result.id = result._id;
  result = JSON.stringify(result);
  result = JSON.parse(result);
  result = sanitizeInternalFields(result);

  // /////////////////////////////////////
  // Send verification email if applicable
  // /////////////////////////////////////

  if (collectionConfig.auth && collectionConfig.auth.verify) {
    sendVerificationEmail({
      emailOptions,
      config: payload.config,
      sendEmail: payload.sendEmail,
      collection: { config: collectionConfig, Model },
      user: result,
      token: verificationToken,
      req,
      disableEmail: disableVerificationEmail,
    });
  }

  // /////////////////////////////////////
  // afterRead - Fields
  // /////////////////////////////////////

  result = await afterRead({
    depth,
    doc: result,
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

    result = await hook({
      req,
      doc: result,
    }) || result;
  }, Promise.resolve());

  // /////////////////////////////////////
  // afterChange - Fields
  // /////////////////////////////////////

  result = await afterChange({
    data,
    doc: result,
    entityConfig: collectionConfig,
    operation: 'create',
    req,
  });

  // /////////////////////////////////////
  // afterChange - Collection
  // /////////////////////////////////////

  await collectionConfig.hooks.afterChange.reduce(async (priorHook: AfterChangeHook | Promise<void>, hook: AfterChangeHook) => {
    await priorHook;

    result = await hook({
      doc: result,
      req: args.req,
      operation: 'create',
    }) || result;
  }, Promise.resolve());

  // /////////////////////////////////////
  // Return results
  // /////////////////////////////////////

  return result;
}

export default create;
