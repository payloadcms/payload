import type { Config as GeneratedTypes } from 'payload/generated-types';
import type { DeepPartial } from 'ts-essentials';

import type { PayloadRequest } from '../../express/types';
import type { Where } from '../../types';
import type { SanitizedGlobalConfig } from '../config/types';

import executeAccess from '../../auth/executeAccess';
import { afterChange } from '../../fields/hooks/afterChange';
import { afterRead } from '../../fields/hooks/afterRead';
import { beforeChange } from '../../fields/hooks/beforeChange';
import { beforeValidate } from '../../fields/hooks/beforeValidate';
import { initTransaction } from '../../utilities/initTransaction';
import { killTransaction } from '../../utilities/killTransaction';
import { getLatestGlobalVersion } from '../../versions/getLatestGlobalVersion';
import { saveVersion } from '../../versions/saveVersion';

type Args<T extends { [field: number | string | symbol]: unknown }> = {
  autosave?: boolean
  data: DeepPartial<Omit<T, 'id'>>
  depth?: number
  draft?: boolean
  globalConfig: SanitizedGlobalConfig
  overrideAccess?: boolean
  req: PayloadRequest
  showHiddenFields?: boolean
  slug: string
}

async function update<TSlug extends keyof GeneratedTypes['globals']>(
  args: Args<GeneratedTypes['globals'][TSlug]>,
): Promise<GeneratedTypes['globals'][TSlug]> {
  const {
    autosave,
    depth,
    draft: draftArg,
    globalConfig,
    overrideAccess,
    req: {
      locale,
      payload,
    },
    req,
    showHiddenFields,
    slug,
  } = args;

  try {
    const shouldCommit = await initTransaction(req);

    let { data } = args;

    const shouldSaveDraft = Boolean(draftArg && globalConfig.versions?.drafts);

    // /////////////////////////////////////
    // 1. Retrieve and execute access
    // /////////////////////////////////////

    const accessResults = !overrideAccess ? await executeAccess({
      data,
      req,
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
      config: globalConfig,
      locale,
      payload,
      req,
      slug,
      where: query,
    });

    let globalJSON: Record<string, unknown> = {};

    if (global) {
      globalJSON = JSON.parse(JSON.stringify(global));

      if (globalJSON._id) {
        delete globalJSON._id;
      }
    }

    const originalDoc = await afterRead({
      context: req.context,
      depth: 0,
      doc: globalJSON,
      entityConfig: globalConfig,
      overrideAccess: true,
      req,
      showHiddenFields,
    });

    // /////////////////////////////////////
    // beforeValidate - Fields
    // /////////////////////////////////////

    data = await beforeValidate({
      context: req.context,
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
        originalDoc,
        req,
      })) || data;
    }, Promise.resolve());

    // /////////////////////////////////////
    // beforeChange - Global
    // /////////////////////////////////////

    await globalConfig.hooks.beforeChange.reduce(async (priorHook, hook) => {
      await priorHook;

      data = (await hook({
        data,
        originalDoc,
        req,
      })) || data;
    }, Promise.resolve());

    // /////////////////////////////////////
    // beforeChange - Fields
    // /////////////////////////////////////

    let result = await beforeChange({
      context: req.context,
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
        result = await payload.db.updateGlobal({
          data: result,
          req,
          slug,
        });
      } else {
        result = await payload.db.createGlobal({
          data: result,
          req,
          slug,
        });
      }
    }

    // /////////////////////////////////////
    // Create version
    // /////////////////////////////////////

    if (globalConfig.versions) {
      result = await saveVersion({
        autosave,
        docWithLocales: {
          ...result,
          createdAt: result.createdAt,
          updatedAt: result.updatedAt,
        },
        draft: shouldSaveDraft,
        global: globalConfig,
        payload,
        req,
      });
    }

    // /////////////////////////////////////
    // afterRead - Fields
    // /////////////////////////////////////

    result = await afterRead({
      context: req.context,
      depth,
      doc: result,
      entityConfig: globalConfig,
      overrideAccess,
      req,
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
      context: req.context,
      data,
      doc: result,
      entityConfig: globalConfig,
      operation: 'update',
      previousDoc: originalDoc,
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

    if (shouldCommit) await payload.db.commitTransaction(req.transactionID);

    return result;
  } catch (error: unknown) {
    await killTransaction(req);
    throw error;
  }
}

export default update;
