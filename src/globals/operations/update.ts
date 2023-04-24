import { Config as GeneratedTypes } from 'payload/generated-types';
import { DeepPartial } from 'ts-essentials';
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
import { getLatestGlobalVersion } from '../../versions/getLatestGlobalVersion';

type Args<T extends { [field: string | number | symbol]: unknown }> = {
  globalConfig: SanitizedGlobalConfig
  slug: string | number | symbol
  req: PayloadRequest
  depth?: number
  overrideAccess?: boolean
  showHiddenFields?: boolean
  draft?: boolean
  autosave?: boolean
  data: DeepPartial<Omit<T, 'id'>>
}

async function update<TSlug extends keyof GeneratedTypes['globals']>(
  args: Args<GeneratedTypes['globals'][TSlug]>,
): Promise<GeneratedTypes['globals'][TSlug]> {
  const {
    globalConfig,
    slug,
    req,
    req: {
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

  const queryToBuild: Where = {
    and: [
      {
        globalType: {
          equals: slug,
        },
      },
    ],
  };

  if (hasWhereAccessResult(accessResults)) {
    queryToBuild.and.push(accessResults);
  }

  const query = await Model.buildQuery({
    where: queryToBuild,
    req,
    overrideAccess,
    globalSlug: slug,
  });

  // /////////////////////////////////////
  // 2. Retrieve document
  // /////////////////////////////////////

  const { global, globalExists } = await getLatestGlobalVersion({
    payload,
    Model,
    config: globalConfig,
    query,
    lean: true,
  });

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

  let result = await beforeChange({
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
      result = await Model.findOneAndUpdate(
        { globalType: slug },
        result,
        { new: true },
      );
    } else {
      result.globalType = slug;
      result = await Model.create(result);
    }
  }

  result = JSON.parse(JSON.stringify(result));
  result = sanitizeInternalFields(result);

  // /////////////////////////////////////
  // Create version
  // /////////////////////////////////////

  if (globalConfig.versions) {
    result = await saveVersion({
      payload,
      global: globalConfig,
      req,
      docWithLocales: {
        ...result,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      },
      autosave,
      draft: shouldSaveDraft,
    });
  }

  // /////////////////////////////////////
  // afterRead - Fields
  // /////////////////////////////////////

  result = await afterRead({
    depth,
    doc: result,
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

    result = await hook({
      doc: result,
      req,
    }) || result;
  }, Promise.resolve());

  // /////////////////////////////////////
  // afterChange - Fields
  // /////////////////////////////////////

  result = await afterChange({
    data,
    doc: result,
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

    result = await hook({
      doc: result,
      previousDoc: originalDoc,
      req,
    }) || result;
  }, Promise.resolve());

  // /////////////////////////////////////
  // Return results
  // /////////////////////////////////////

  return result;
}

export default update;
