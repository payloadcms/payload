import { Config as GeneratedTypes } from 'payload/generated-types';
import { Where } from '../../types';
import { SanitizedGlobalConfig } from '../config/types';
import executeAccess from '../../auth/executeAccess';
import { hasWhereAccessResult } from '../../auth';
import { beforeChange } from '../../fields/hooks/beforeChange';
import { beforeValidate } from '../../fields/hooks/beforeValidate';
import { afterChange } from '../../fields/hooks/afterChange';
import { afterRead } from '../../fields/hooks/afterRead';
import { PayloadRequest } from '../../express/types';
import { saveVersion } from '../../versions/saveVersion';
import sanitizeInternalFields from '../../utilities/sanitizeInternalFields';
import { getLatestEntityVersion } from '../../versions/getLatestCollectionVersion';

type Args<T extends { [field: string | number | symbol]: unknown }> = {
  globalConfig: SanitizedGlobalConfig
  slug: string | number | symbol
  req: PayloadRequest
  depth?: number
  overrideAccess?: boolean
  showHiddenFields?: boolean
  draft?: boolean
  autosave?: boolean
  data: Omit<T, 'id'>
}

async function update<TSlug extends keyof GeneratedTypes['globals']>(
  args: Args<GeneratedTypes['globals'][TSlug]>,
): Promise<GeneratedTypes['globals'][TSlug]> {
  const {
    globalConfig,
    slug,
    req,
    req: {
      locale,
      payload,
      payload: {
        globals: {
          Model,
        },
      },
    },
    depth,
    overrideAccess,
    showHiddenFields,
    draft: draftArg,
    autosave,
  } = args;

  let { data } = args;

  const shouldSaveDraft = Boolean(draftArg && globalConfig.versions?.drafts);

  // /////////////////////////////////////
  // 1. Retrieve and execute access
  // /////////////////////////////////////

  const accessResults = !overrideAccess ? await executeAccess({ req, data }, globalConfig.access.update) : true;

  // /////////////////////////////////////
  // Retrieve document
  // /////////////////////////////////////

  const queryToBuild: { where: Where } = {
    where: {
      and: [
        {
          globalType: {
            equals: slug,
          },
        },
      ],
    },
  };

  if (hasWhereAccessResult(accessResults)) {
    (queryToBuild.where.and as Where[]).push(accessResults);
  }

  const query = await Model.buildQuery(queryToBuild, locale);

  // /////////////////////////////////////
  // 2. Retrieve document
  // /////////////////////////////////////

  let global = await getLatestEntityVersion({
    payload,
    Model,
    config: globalConfig,
    query,
    lean: true,
    entityType: 'global',
  });

  const globalExists = Boolean(global);

  let globalJSON: Record<string, unknown> = {};

  if (global) {
    globalJSON = JSON.parse(JSON.stringify(global));

    if (globalJSON._id) {
      delete globalJSON._id;
    }
  }

  const originalDoc = await afterRead({
    depth,
    doc: globalJSON,
    entityConfig: globalConfig,
    req,
    overrideAccess: true,
    showHiddenFields,
  });

  // /////////////////////////////////////
  // beforeValidate - Fields
  // /////////////////////////////////////

  data = await beforeValidate({
    data,
    doc: originalDoc,
    entityConfig: globalConfig,
    operation: 'update',
    overrideAccess,
    req,
  });

  // /////////////////////////////////////
  // beforeValidate - Global
  // /////////////////////////////////////

  await globalConfig.hooks.beforeValidate.reduce(async (priorHook, hook) => {
    await priorHook;

    data = (await hook({
      data,
      req,
      originalDoc,
    })) || data;
  }, Promise.resolve());

  // /////////////////////////////////////
  // beforeChange - Global
  // /////////////////////////////////////

  await globalConfig.hooks.beforeChange.reduce(async (priorHook, hook) => {
    await priorHook;

    data = (await hook({
      data,
      req,
      originalDoc,
    })) || data;
  }, Promise.resolve());

  // /////////////////////////////////////
  // beforeChange - Fields
  // /////////////////////////////////////

  const result = await beforeChange({
    data,
    doc: originalDoc,
    docWithLocales: globalJSON,
    entityConfig: globalConfig,
    operation: 'update',
    req,
    skipValidation: shouldSaveDraft,
  });

  // /////////////////////////////////////
  // Update
  // /////////////////////////////////////

  if (!shouldSaveDraft) {
    if (globalExists) {
      global = await Model.findOneAndUpdate(
        { globalType: slug },
        result,
        { new: true },
      );
    } else {
      result.globalType = slug;
      global = await Model.create(result);
    }
  }

  global = JSON.parse(JSON.stringify(global));
  global = sanitizeInternalFields(global);

  // /////////////////////////////////////
  // Create version
  // /////////////////////////////////////

  if (globalConfig.versions) {
    global = await saveVersion({
      payload,
      global: globalConfig,
      req,
      docWithLocales: {
        ...result,
        createdAt: global.createdAt,
        updatedAt: global.updatedAt,
      },
      autosave,
      draft: shouldSaveDraft,
    });
  }

  // /////////////////////////////////////
  // afterRead - Fields
  // /////////////////////////////////////

  global = await afterRead({
    depth,
    doc: global,
    entityConfig: globalConfig,
    req,
    overrideAccess,
    showHiddenFields,
  });

  // /////////////////////////////////////
  // afterRead - Global
  // /////////////////////////////////////

  await globalConfig.hooks.afterRead.reduce(async (priorHook, hook) => {
    await priorHook;

    global = await hook({
      doc: global,
      req,
    }) || global;
  }, Promise.resolve());

  // /////////////////////////////////////
  // afterChange - Fields
  // /////////////////////////////////////

  global = await afterChange({
    data,
    doc: global,
    previousDoc: originalDoc,
    entityConfig: globalConfig,
    operation: 'update',
    req,
  });

  // /////////////////////////////////////
  // afterChange - Global
  // /////////////////////////////////////

  await globalConfig.hooks.afterChange.reduce(async (priorHook, hook) => {
    await priorHook;

    global = await hook({
      doc: global,
      previousDoc: originalDoc,
      req,
    }) || global;
  }, Promise.resolve());

  // /////////////////////////////////////
  // Return results
  // /////////////////////////////////////

  return global;
}

export default update;
