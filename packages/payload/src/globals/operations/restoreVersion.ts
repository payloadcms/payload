import { PayloadRequest } from '../../express/types.js';
import executeAccess from '../../auth/executeAccess.js';
import { TypeWithVersion } from '../../versions/types.js';
import { SanitizedGlobalConfig } from '../config/types.js';
import { NotFound } from '../../errors/index.js';
import { afterChange } from '../../fields/hooks/afterChange/index.js';
import { afterRead } from '../../fields/hooks/afterRead/index.js';
import { initTransaction } from '../../utilities/initTransaction.js';
import { killTransaction } from '../../utilities/killTransaction.js';

export type Arguments = {
  globalConfig: SanitizedGlobalConfig
  id: string | number
  depth?: number
  req?: PayloadRequest
  overrideAccess?: boolean
  showHiddenFields?: boolean
}

async function restoreVersion<T extends TypeWithVersion<T> = any>(args: Arguments): Promise<T> {
  const {
    id,
    depth,
    globalConfig,
    req,
    req: {
      t,
      payload,
    },
    overrideAccess,
    showHiddenFields,
  } = args;

  try {
    const shouldCommit = await initTransaction(req);

    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////

    if (!overrideAccess) {
      await executeAccess({ req }, globalConfig.access.update);
    }

    // /////////////////////////////////////
    // Retrieve original raw version
    // /////////////////////////////////////

    const { docs: versionDocs } = await payload.db.findGlobalVersions<any>({
      global: globalConfig.slug,
      where: { id: { equals: id } },
      limit: 1,
      req,
    });


    if (!versionDocs || versionDocs.length === 0) {
      throw new NotFound(t);
    }

    const rawVersion = versionDocs[0];

    // /////////////////////////////////////
    // fetch previousDoc
    // /////////////////////////////////////

    const previousDoc = await payload.findGlobal({
      slug: globalConfig.slug,
      depth,
      req,
    });

    // /////////////////////////////////////
    // Update global
    // /////////////////////////////////////

    const global = await payload.db.findGlobal({
      slug: globalConfig.slug,
    });

    let result = rawVersion.version;

    if (global) {
      result = await payload.db.updateGlobal({
        slug: globalConfig.slug,
        data: result,
      });
    } else {
      result = await payload.db.createGlobal({
        slug: globalConfig.slug,
        data: result,
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
      data: result,
      doc: result,
      previousDoc,
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
        previousDoc,
        req,
      }) || result;
    }, Promise.resolve());

    if (shouldCommit) await payload.db.commitTransaction(req.transactionID);

    return result;
  } catch (error: unknown) {
    await killTransaction(req);
    throw error;
  }
}

export default restoreVersion;
