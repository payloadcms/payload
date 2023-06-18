import fs from 'fs';
import { promisify } from 'util';

import crypto from 'crypto';
import { Config as GeneratedTypes } from 'payload/generated-types';
import { MarkOptional } from 'ts-essentials';
import executeAccess from '../../auth/executeAccess';
import sanitizeInternalFields from '../../utilities/sanitizeInternalFields';

import { ValidationError } from '../../errors';

import sendVerificationEmail from '../../auth/sendVerificationEmail';
import { AfterChangeHook, BeforeOperationHook, BeforeValidateHook, Collection } from '../config/types';
import { PayloadRequest } from '../../express/types';
import { Document } from '../../types';
import { fieldAffectsData } from '../../fields/config/types';
import { uploadFiles } from '../../uploads/uploadFiles';
import { beforeChange } from '../../fields/hooks/beforeChange';
import { beforeValidate } from '../../fields/hooks/beforeValidate';
import { afterChange } from '../../fields/hooks/afterChange';
import { afterRead } from '../../fields/hooks/afterRead';
import { generateFileData } from '../../uploads/generateFileData';
import { saveVersion } from '../../versions/saveVersion';
import { mapAsync } from '../../utilities/mapAsync';
import { registerLocalStrategy } from '../../auth/strategies/local/register';

const unlinkFile = promisify(fs.unlink);

export type Arguments<T extends { [field: string | number | symbol]: unknown }> = {
  collection: Collection
  req: PayloadRequest
  depth?: number
  disableVerificationEmail?: boolean
  overrideAccess?: boolean
  showHiddenFields?: boolean
  data: MarkOptional<T, 'id' | 'updatedAt' | 'createdAt' | 'sizes'>
  overwriteExistingFiles?: boolean
  draft?: boolean
  autosave?: boolean
}

async function create<TSlug extends keyof GeneratedTypes['collections']>(
  incomingArgs: Arguments<GeneratedTypes['collections'][TSlug]>,
): Promise<GeneratedTypes['collections'][TSlug]> {
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
    autosave = false,
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
  // Generate data for all files and sizes
  // /////////////////////////////////////

  const { data: newFileData, files: filesToUpload } = await generateFileData({
    config,
    collection,
    req,
    data,
    throwOnMissingFile: !shouldSaveDraft,
    overwriteExistingFiles,
  });

  data = newFileData;

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
  // Write files to local storage
  // /////////////////////////////////////

  if (!collectionConfig.upload.disableLocalStorage) {
    await uploadFiles(payload, filesToUpload, req.t);
  }

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

  const resultWithLocales = await beforeChange<Record<string, unknown>>({
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

  if (collectionConfig.auth && !collectionConfig.auth.disableLocalStrategy) {
    if (data.email) {
      resultWithLocales.email = (data.email as string).toLowerCase();
    }

    if (collectionConfig.auth.verify) {
      resultWithLocales._verified = Boolean(resultWithLocales._verified) || false;
      resultWithLocales._verificationToken = crypto.randomBytes(20).toString('hex');
    }

    doc = await registerLocalStrategy({
      collection: collectionConfig,
      doc: resultWithLocales,
      payload: req.payload,
      password: data.password as string,
    })
  } else {
    try {
      doc = await Model.create(resultWithLocales);
    } catch (error) {
      // Handle uniqueness error from MongoDB
      throw error.code === 11000 && error.keyValue
        ? new ValidationError([{ message: req.t('error:valueMustBeUnique'), field: Object.keys(error.keyValue)[0] }], req.t)
        : error;
    }
  }

  let result: Document = doc.toJSON({ virtuals: true });
  const verificationToken = result._verificationToken;

  // custom id type reset
  result.id = result._id;
  result = JSON.parse(JSON.stringify(result));
  result = sanitizeInternalFields(result);

  // /////////////////////////////////////
  // Create version
  // /////////////////////////////////////

  if (collectionConfig.versions) {
    await saveVersion({
      payload,
      collection: collectionConfig,
      req,
      id: result.id,
      docWithLocales: result,
      autosave,
    });
  }

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
    previousDoc: {},
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
      previousDoc: {},
      req: args.req,
      operation: 'create',
    }) || result;
  }, Promise.resolve());

  // Remove temp files if enabled, as express-fileupload does not do this automatically
  if (config.upload?.useTempFiles && collectionConfig.upload) {
    const { files } = req;
    const fileArray = Array.isArray(files) ? files : [files];
    await mapAsync(fileArray, async ({ file }) => {
      // Still need this check because this will not be populated if using local API
      if (file.tempFilePath) {
        await unlinkFile(file.tempFilePath);
      }
    });
  }

  // /////////////////////////////////////
  // Return results
  // /////////////////////////////////////

  return result;
}

export default create;
