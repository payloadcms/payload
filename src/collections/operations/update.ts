import httpStatus from 'http-status';
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
import { beforeChange } from '../../fields/hooks/beforeChange';
import { beforeValidate } from '../../fields/hooks/beforeValidate';
import { afterChange } from '../../fields/hooks/afterChange';
import { afterRead } from '../../fields/hooks/afterRead';

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

async function update(incomingArgs: Arguments): Promise<Document> {
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
      payload,
      payload: {
        config,
      },
    },
    overrideAccess,
    showHiddenFields,
    overwriteExistingFiles = false,
    draft: draftArg = false,
    autosave = false,
  } = args;

  let { data } = args;

  if (!id) {
    throw new APIError('Missing ID of document to update.', httpStatus.BAD_REQUEST);
  }

  const shouldSaveDraft = Boolean(draftArg && collectionConfig.versions.drafts);

  // /////////////////////////////////////
  // Access
  // /////////////////////////////////////

  const accessResults = !overrideAccess ? await executeAccess({ req, id, data }, collectionConfig.access.update) : true;
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

  const originalDoc = await afterRead({
    depth: 0,
    doc: docWithLocales,
    entityConfig: collectionConfig,
    req,
    overrideAccess: true,
    showHiddenFields,
  });

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

  data = await beforeValidate({
    data,
    doc: originalDoc,
    entityConfig: collectionConfig,
    id,
    operation: 'update',
    overrideAccess,
    req,
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

  let result = await beforeChange({
    data,
    doc: originalDoc,
    docWithLocales,
    entityConfig: collectionConfig,
    id,
    operation: 'update',
    req,
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
      payload,
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
      payload,
      config: collectionConfig,
      req,
      docWithLocales,
      id,
    });

    result = await saveCollectionDraft({
      payload,
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
        payload,
        entityConfig: collectionConfig,
        version: createdVersion,
      });

      // Handle uniqueness error from MongoDB
      throw error.code === 11000 && error.keyValue
        ? new ValidationError([{ message: 'Value must be unique', field: Object.keys(error.keyValue)[0] }])
        : error;
    }

    const resultString = JSON.stringify(result);
    result = JSON.parse(resultString);

    // custom id type reset
    result.id = result._id;
  }

  result = sanitizeInternalFields(result);

  // /////////////////////////////////////
  // afterRead - Fields
  // /////////////////////////////////////

  result = await afterRead({
    depth,
    doc: result,
    entityConfig: collectionConfig,
    req,
    overrideAccess,
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
    previousDoc: originalDoc,
    entityConfig: collectionConfig,
    operation: 'update',
    req,
  });

  // /////////////////////////////////////
  // afterChange - Collection
  // /////////////////////////////////////

  await collectionConfig.hooks.afterChange.reduce(async (priorHook, hook) => {
    await priorHook;

    result = await hook({
      doc: result,
      previousDoc: originalDoc,
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
