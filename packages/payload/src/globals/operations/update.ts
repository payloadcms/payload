import { Config as GeneratedTypes } from 'payload/generated-types';
import { DeepPartial } from 'ts-essentials';
import type { Where } from '../../types/index.js';
import { SanitizedGlobalConfig } from '../config/types.js';
import executeAccess from '../../auth/executeAccess.js';
import { beforeChange } from '../../fields/hooks/beforeChange/index.js';
import { beforeValidate } from '../../fields/hooks/beforeValidate/index.js';
import { afterChange } from '../../fields/hooks/afterChange/index.js';
import { afterRead } from '../../fields/hooks/afterRead/index.js';
import { PayloadRequest } from '../../express/types.js';
import { saveVersion } from '../../versions/saveVersion.js';
import { getLatestGlobalVersion } from '../../versions/getLatestGlobalVersion.js';
import { initTransaction } from '../../utilities/initTransaction.js';
import { killTransaction } from '../../utilities/killTransaction.js';

type Args<T extends { [field: string | number | symbol]: unknown }> = {
  globalConfig: SanitizedGlobalConfig
  slug: string
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
      locale,
    },
    depth,
    overrideAccess,
    showHiddenFields,
    draft: draftArg,
    autosave,
  } = args;

  try {
    const shouldCommit = await initTransaction(req);

    let { data } = args;

    const shouldSaveDraft = Boolean(draftArg && globalConfig.versions?.drafts);

    // /////////////////////////////////////
    // 1. Retrieve and execute access
    // /////////////////////////////////////

    const accessResults = !overrideAccess ? await executeAccess({
      req,
      data,
    }, globalConfig.access.update) : true;

    // /////////////////////////////////////
    // Retrieve document
    // /////////////////////////////////////

    const query: Where = overrideAccess ? undefined : accessResults as Where;

    // /////////////////////////////////////
    // 2. Retrieve document
    // /////////////////////////////////////
    const {
      global,
      globalExists,
    } = await getLatestGlobalVersion({
      payload,
      config: globalConfig,
      slug,
      where: query,
      locale,
      req,
    });

    let globalJSON: Record<string, unknown> = {};

    if (global) {
      globalJSON = JSON.parse(JSON.stringify(global));

      if (globalJSON._id) {
        delete globalJSON._id;
      }
    }

    const originalDoc = await afterRead({
      depth: 0,
      doc: globalJSON,
      entityConfig: globalConfig,
      req,
      overrideAccess: true,
      showHiddenFields,
      context: req.context,
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
      context: req.context,
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
      context: req.context,
    });

    // /////////////////////////////////////
    // Update
    // /////////////////////////////////////

    if (!shouldSaveDraft) {
      if (globalExists) {
        result = await payload.db.updateGlobal({
          slug,
          data: result,
          req,
        });
      } else {
        result = await payload.db.createGlobal({
          slug,
          data: result,
          req,
        });
      }
    }

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
      context: req.context,
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
      context: req.context,
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

    if (shouldCommit) await payload.db.commitTransaction(req.transactionID);

    return result;
  } catch (error: unknown) {
    await killTransaction(req);
    throw error;
  }
}

export default update;
