import { docHasTimestamps, Where } from '../../types';
import { SanitizedGlobalConfig, TypeWithID } from '../config/types';
import executeAccess from '../../auth/executeAccess';
import { hasWhereAccessResult } from '../../auth';
import { beforeChange } from '../../fields/hooks/beforeChange';
import { beforeValidate } from '../../fields/hooks/beforeValidate';
import { afterChange } from '../../fields/hooks/afterChange';
import { afterRead } from '../../fields/hooks/afterRead';
import { PayloadRequest } from '../../express/types';
import { saveVersion } from '../../versions/saveVersion';
import sanitizeInternalFields from '../../utilities/sanitizeInternalFields';

type Args = {
  globalConfig: SanitizedGlobalConfig
  slug: string
  req: PayloadRequest
  depth?: number
  overrideAccess?: boolean
  showHiddenFields?: boolean
  draft?: boolean
  autosave?: boolean
  data: Record<string, unknown>
}

async function update<T extends TypeWithID = any>(args: Args): Promise<T> {
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

  let version;
  let global;

  if (globalConfig.versions?.drafts) {
    version = payload.versions[globalConfig.slug].findOne({}, {}, {
      sort: {
        updatedAt: 'desc',
      },
      lean: true,
    });
  }

  const existingGlobal = await payload.globals.Model.findOne(query).lean();
  version = await version;

  if (!version || (existingGlobal && docHasTimestamps(existingGlobal) && version.updatedAt < existingGlobal.updatedAt)) {
    global = existingGlobal;
  } else {
    global = {
      ...version.version,
      updatedAt: version.updatedAt,
      createdAt: version.createdAt,
    };
  }

  let globalJSON: Record<string, unknown> = {};

  if (global) {
    const globalJSONString = JSON.stringify(global);
    globalJSON = JSON.parse(globalJSONString);

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
    if (existingGlobal) {
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

  global = JSON.stringify(global);
  global = JSON.parse(global);
  global = sanitizeInternalFields(global);

  // /////////////////////////////////////
  // Create version
  // /////////////////////////////////////

  if (globalConfig.versions) {
    global = await saveVersion({
      payload,
      global: globalConfig,
      req,
      docWithLocales: result,
      autosave,
      draft: shouldSaveDraft,
      createdAt: global.createdAt,
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
