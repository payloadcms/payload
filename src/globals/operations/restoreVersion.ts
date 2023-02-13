import { PayloadRequest } from '../../express/types';
import executeAccess from '../../auth/executeAccess';
import sanitizeInternalFields from '../../utilities/sanitizeInternalFields';
import { TypeWithVersion } from '../../versions/types';
import { SanitizedGlobalConfig } from '../config/types';
import { NotFound } from '../../errors';
import { afterChange } from '../../fields/hooks/afterChange';
import { afterRead } from '../../fields/hooks/afterRead';
import { ClientSession } from 'mongoose';

export type Arguments = {
  globalConfig: SanitizedGlobalConfig
  session?: ClientSession
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
      payload: {
        globals: {
          Model,
        },
      },
    },
    overrideAccess,
    showHiddenFields,
  } = args;

  const session = args.session || req.session;
  const sessionOpts = session ? { session } : undefined;

  // /////////////////////////////////////
  // Access
  // /////////////////////////////////////

  if (!overrideAccess) {
    await executeAccess({ req }, globalConfig.access.update);
  }

  // /////////////////////////////////////
  // Retrieve original raw version
  // /////////////////////////////////////

  const VersionModel = payload.versions[globalConfig.slug];

  let rawVersion = await VersionModel.findOne({ _id: id }, {}, sessionOpts);

  if (!rawVersion) {
    throw new NotFound(t);
  }

  rawVersion = rawVersion.toJSON({ virtuals: true });

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

  const global = await Model.findOne({ globalType: globalConfig.slug }, {}, sessionOpts);

  let result = rawVersion.version;

  if (global) {
    result = await Model.findOneAndUpdate(
      { globalType: globalConfig.slug },
      result,
      {
        new: true,
        ...sessionOpts,
      },
    );
  } else {
    result.globalType = globalConfig.slug;
    result = await Model.create([result], sessionOpts);
  }

  result = result.toJSON({ virtuals: true });

  // custom id type reset
  result.id = result._id;
  result = JSON.stringify(result);
  result = JSON.parse(result);
  result = sanitizeInternalFields(result);

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
