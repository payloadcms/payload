import { PayloadRequest } from '../../express/types';
import executeAccess from '../../auth/executeAccess';
import { TypeWithVersion } from '../../versions/types';
import { SanitizedGlobalConfig } from '../config/types';
import { NotFound } from '../../errors';
import { afterChange } from '../../fields/hooks/afterChange';
import { afterRead } from '../../fields/hooks/afterRead';

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

  return result;
}

export default restoreVersion;
