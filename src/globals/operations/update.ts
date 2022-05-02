import { Payload } from '../..';
import { Where } from '../../types';
import { TypeWithID } from '../config/types';
import executeAccess from '../../auth/executeAccess';
import sanitizeInternalFields from '../../utilities/sanitizeInternalFields';
import { saveGlobalVersion } from '../../versions/saveGlobalVersion';
import { saveGlobalDraft } from '../../versions/drafts/saveGlobalDraft';
import { ensurePublishedGlobalVersion } from '../../versions/ensurePublishedGlobalVersion';
import cleanUpFailedVersion from '../../versions/cleanUpFailedVersion';
import { hasWhereAccessResult } from '../../auth';
import { beforeChange } from '../../fields/hooks/beforeChange';
import { beforeValidate } from '../../fields/hooks/beforeValidate';
import { afterChange } from '../../fields/hooks/afterChange';
import { afterRead } from '../../fields/hooks/afterRead';

async function update<T extends TypeWithID = any>(this: Payload, args): Promise<T> {
  const { globals: { Model } } = this;

  const {
    globalConfig,
    slug,
    req,
    req: {
      locale,
    },
    depth,
    overrideAccess,
    showHiddenFields,
    draft: draftArg,
    autosave,
  } = args;

  let { data } = args;

  const shouldSaveDraft = Boolean(draftArg && globalConfig.versions.drafts);

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

  let global: any = await Model.findOne(query);
  let globalJSON: Record<string, unknown> = {};

  if (global) {
    globalJSON = global.toJSON({ virtuals: true });
    const globalJSONString = JSON.stringify(globalJSON);
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
  // Create version from existing doc
  // /////////////////////////////////////

  let createdVersion;

  if (globalConfig.versions && !shouldSaveDraft) {
    createdVersion = await saveGlobalVersion({
      payload: this,
      config: globalConfig,
      req,
      docWithLocales: result,
    });
  }

  // /////////////////////////////////////
  // Update
  // /////////////////////////////////////

  if (shouldSaveDraft) {
    await ensurePublishedGlobalVersion({
      payload: this,
      config: globalConfig,
      req,
      docWithLocales: result,
    });

    global = await saveGlobalDraft({
      payload: this,
      config: globalConfig,
      data: result,
      autosave,
    });
  } else {
    try {
      if (global) {
        global = await Model.findOneAndUpdate(
          { globalType: slug },
          result,
          { new: true },
        );
      } else {
        result.globalType = slug;
        global = await Model.create(result);
      }
    } catch (error) {
      cleanUpFailedVersion({
        payload: this,
        entityConfig: globalConfig,
        version: createdVersion,
      });
    }
  }

  global = JSON.stringify(global);
  global = JSON.parse(global);
  global = sanitizeInternalFields(global);

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

  await globalConfig.hooks.afterChange.reduce(async (priorHook, hook) => {
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
      req,
    }) || result;
  }, Promise.resolve());

  // /////////////////////////////////////
  // Return results
  // /////////////////////////////////////

  return global;
}

export default update;
