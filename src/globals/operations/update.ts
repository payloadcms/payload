import { Payload } from '../..';
import { TypeWithID } from '../config/types';
import executeAccess from '../../auth/executeAccess';
import sanitizeInternalFields from '../../utilities/sanitizeInternalFields';
import { saveGlobalVersion } from '../../versions/saveGlobalVersion';
import { saveGlobalDraft } from '../../versions/drafts/saveGlobalDraft';
import { ensurePublishedGlobalVersion } from '../../versions/ensurePublishedGlobalVersion';
import cleanUpFailedVersion from '../../versions/cleanUpFailedVersion';

async function update<T extends TypeWithID = any>(this: Payload, args): Promise<T> {
  const { globals: { Model } } = this;

  const {
    globalConfig,
    slug,
    req,
    depth,
    overrideAccess,
    showHiddenFields,
    draft: draftArg,
    autosave,
  } = args;

  const shouldSaveDraft = Boolean(draftArg && globalConfig.versions.drafts);

  // /////////////////////////////////////
  // 1. Retrieve and execute access
  // /////////////////////////////////////

  if (!overrideAccess) {
    await executeAccess({ req }, globalConfig.access.update);
  }

  // /////////////////////////////////////
  // 2. Retrieve document
  // /////////////////////////////////////

  let global: any = await Model.findOne({ globalType: slug });
  let globalJSON;

  if (global) {
    globalJSON = global.toJSON({ virtuals: true });
    globalJSON = JSON.stringify(globalJSON);
    globalJSON = JSON.parse(globalJSON);

    if (globalJSON._id) {
      delete globalJSON._id;
    }
  }

  const originalDoc = await this.performFieldOperations(globalConfig, {
    depth,
    req,
    data: globalJSON,
    hook: 'afterRead',
    operation: 'update',
    overrideAccess: true,
    flattenLocales: true,
    showHiddenFields,
  });

  let { data } = args;

  // /////////////////////////////////////
  // beforeValidate - Fields
  // /////////////////////////////////////

  data = await this.performFieldOperations(globalConfig, {
    data,
    req,
    originalDoc,
    hook: 'beforeValidate',
    operation: 'update',
    overrideAccess,
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

  const result = await this.performFieldOperations(globalConfig, {
    data,
    req,
    hook: 'beforeChange',
    operation: 'update',
    unflattenLocales: true,
    originalDoc,
    docWithLocales: globalJSON,
    overrideAccess,
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

  global = global.toJSON({ virtuals: true });
  global = JSON.stringify(global);
  global = JSON.parse(global);
  global = sanitizeInternalFields(global);

  // /////////////////////////////////////
  // afterRead - Fields
  // /////////////////////////////////////

  global = await this.performFieldOperations(globalConfig, {
    data: global,
    hook: 'afterRead',
    operation: 'read',
    req,
    depth,
    showHiddenFields,
    flattenLocales: true,
    overrideAccess,
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

  global = await this.performFieldOperations(globalConfig, {
    data: global,
    hook: 'afterChange',
    operation: 'update',
    req,
    depth,
    overrideAccess,
    showHiddenFields,
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
