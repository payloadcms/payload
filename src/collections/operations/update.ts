import httpStatus from 'http-status';
import { Payload } from '../..';
import { Where, Document } from '../../types';
import { Collection } from '../config/types';
import sanitizeInternalFields from '../../utilities/sanitizeInternalFields';
import executeAccess from '../../auth/executeAccess';
import { NotFound, Forbidden, APIError, ValidationError } from '../../errors';
import { PayloadRequest } from '../../express/types';
import { hasWhereAccessResult, UserDocument } from '../../auth/types';
import { saveCollectionDraft } from '../../versions/drafts/saveCollectionDraft';
import { saveCollectionVersion } from '../../versions/saveCollectionVersion';
import uploadFile from '../../uploads/uploadFile';
import cleanUpFailedVersion from '../../versions/cleanUpFailedVersion';
import { ensurePublishedCollectionVersion } from '../../versions/ensurePublishedCollectionVersion';

export type Arguments = {
  collection: Collection
  req: PayloadRequest
  id: string | number
  data: Record<string, unknown>
  depth?: number
  disableVerificationEmail?: boolean
  overrideAccess?: boolean
  showHiddenFields?: boolean
  overwriteExistingFiles?: boolean
  draft?: boolean
  autosave?: boolean
}

async function update(this: Payload, incomingArgs: Arguments): Promise<Document> {
  const { config } = this;

  let args = incomingArgs;

  // /////////////////////////////////////
  // beforeOperation - Collection
  // /////////////////////////////////////

  await args.collection.config.hooks.beforeOperation.reduce(async (priorHook, hook) => {
    await priorHook;

    args = (await hook({
      args,
      operation: 'update',
    })) || args;
  }, Promise.resolve());

  const {
    depth,
    collection,
    collection: {
      Model,
      config: collectionConfig,
    },
    id,
    req,
    req: {
      locale,
    },
    overrideAccess,
    showHiddenFields,
    overwriteExistingFiles = false,
    draft: draftArg = false,
    autosave = false,
  } = args;

  if (!id) {
    throw new APIError('Missing ID of document to update.', httpStatus.BAD_REQUEST);
  }

  const shouldSaveDraft = Boolean(draftArg && collectionConfig.versions.drafts);

  // /////////////////////////////////////
  // Access
  // /////////////////////////////////////

  const accessResults = !overrideAccess ? await executeAccess({ req, id }, collectionConfig.access.update) : true;
  const hasWherePolicy = hasWhereAccessResult(accessResults);

  // /////////////////////////////////////
  // Retrieve document
  // /////////////////////////////////////

  const queryToBuild: { where: Where } = {
    where: {
      and: [
        {
          id: {
            equals: id,
          },
        },
      ],
    },
  };

  if (hasWhereAccessResult(accessResults)) {
    (queryToBuild.where.and as Where[]).push(accessResults);
  }

  const query = await Model.buildQuery(queryToBuild, locale);

  const doc = await Model.findOne(query) as UserDocument;

  if (!doc && !hasWherePolicy) throw new NotFound();
  if (!doc && hasWherePolicy) throw new Forbidden();

  let docWithLocales: Document = doc.toJSON({ virtuals: true });
  docWithLocales = JSON.stringify(docWithLocales);
  docWithLocales = JSON.parse(docWithLocales);

  const originalDoc = await this.performFieldOperations(collectionConfig, {
    id,
    depth: 0,
    req,
    data: docWithLocales,
    hook: 'afterRead',
    operation: 'update',
    overrideAccess: true,
    flattenLocales: true,
    showHiddenFields,
  });

  let { data } = args;

  // /////////////////////////////////////
  // Upload and resize potential files
  // /////////////////////////////////////

  data = await uploadFile({
    config,
    collection,
    req,
    data,
    throwOnMissingFile: false,
    overwriteExistingFiles,
  });

  // /////////////////////////////////////
  // beforeValidate - Fields
  // /////////////////////////////////////

  data = await this.performFieldOperations(collectionConfig, {
    data,
    req,
    id,
    originalDoc,
    hook: 'beforeValidate',
    operation: 'update',
    overrideAccess,
  });

  // // /////////////////////////////////////
  // // beforeValidate - Collection
  // // /////////////////////////////////////

  await collectionConfig.hooks.beforeValidate.reduce(async (priorHook, hook) => {
    await priorHook;

    data = (await hook({
      data,
      req,
      operation: 'update',
      originalDoc,
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
      originalDoc,
      operation: 'update',
    })) || data;
  }, Promise.resolve());

  // /////////////////////////////////////
  // beforeChange - Fields
  // /////////////////////////////////////

  let result = await this.performFieldOperations(collectionConfig, {
    data,
    req,
    id,
    originalDoc,
    hook: 'beforeChange',
    operation: 'update',
    overrideAccess,
    unflattenLocales: true,
    docWithLocales,
    skipValidation: shouldSaveDraft,
  });

  // /////////////////////////////////////
  // Handle potential password update
  // /////////////////////////////////////

  const { password } = data;

  if (password && collectionConfig.auth && !shouldSaveDraft) {
    await doc.setPassword(password as string);
    await doc.save();
    delete data.password;
    delete result.password;
  }

  // /////////////////////////////////////
  // Create version from existing doc
  // /////////////////////////////////////

  let createdVersion;

  if (collectionConfig.versions && !shouldSaveDraft) {
    createdVersion = await saveCollectionVersion({
      payload: this,
      config: collectionConfig,
      req,
      docWithLocales,
      id,
    });
  }

  // /////////////////////////////////////
  // Update
  // /////////////////////////////////////

  if (shouldSaveDraft) {
    await ensurePublishedCollectionVersion({
      payload: this,
      config: collectionConfig,
      req,
      docWithLocales,
      id,
    });

    result = await saveCollectionDraft({
      payload: this,
      config: collectionConfig,
      req,
      data: result,
      id,
      autosave,
    });
  } else {
    try {
      result = await Model.findByIdAndUpdate(
        { _id: id },
        result,
        { new: true },
      );
    } catch (error) {
      cleanUpFailedVersion({
        payload: this,
        entityConfig: collectionConfig,
        version: createdVersion,
      });

      // Handle uniqueness error from MongoDB
      throw error.code === 11000
        ? new ValidationError([{ message: 'Value must be unique', field: Object.keys(error.keyValue)[0] }])
        : error;
    }

    result = JSON.stringify(result);
    result = JSON.parse(result);

    // custom id type reset
    result.id = result._id;
  }

  result = sanitizeInternalFields(result);

  // /////////////////////////////////////
  // afterRead - Fields
  // /////////////////////////////////////

  result = await this.performFieldOperations(collectionConfig, {
    id,
    depth,
    req,
    data: result,
    hook: 'afterRead',
    operation: 'update',
    overrideAccess,
    flattenLocales: true,
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

  result = await this.performFieldOperations(collectionConfig, {
    data: result,
    hook: 'afterChange',
    operation: 'update',
    req,
    id,
    depth,
    overrideAccess,
    showHiddenFields,
  });

  // /////////////////////////////////////
  // afterChange - Collection
  // /////////////////////////////////////

  await collectionConfig.hooks.afterChange.reduce(async (priorHook, hook) => {
    await priorHook;

    result = await hook({
      doc: result,
      req,
      operation: 'update',
    }) || result;
  }, Promise.resolve());

  // /////////////////////////////////////
  // Return results
  // /////////////////////////////////////

  return result;
}

export default update;
