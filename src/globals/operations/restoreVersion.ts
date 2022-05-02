import { PayloadRequest } from '../../express/types';
import executeAccess from '../../auth/executeAccess';
import sanitizeInternalFields from '../../utilities/sanitizeInternalFields';
import { PaginatedDocs } from '../../mongoose/types';
import { TypeWithVersion } from '../../versions/types';
import { SanitizedGlobalConfig } from '../config/types';
import { Payload } from '../..';
import { NotFound } from '../../errors';
import { afterChange } from '../../fields/hooks/afterChange';
import { afterRead } from '../../fields/hooks/afterRead';

export type Arguments = {
  globalConfig: SanitizedGlobalConfig
  id: string
  depth?: number
  req?: PayloadRequest
  overrideAccess?: boolean
  showHiddenFields?: boolean
}

async function restoreVersion<T extends TypeWithVersion<T> = any>(this: Payload, args: Arguments): Promise<PaginatedDocs<T>> {
  const { globals: { Model } } = this;

  const {
    id,
    depth,
    globalConfig,
    req,
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

  const VersionModel = this.versions[globalConfig.slug];

  let rawVersion = await VersionModel.findOne({
    _id: id,
  });

  if (!rawVersion) {
    throw new NotFound();
  }

  rawVersion = rawVersion.toJSON({ virtuals: true });

  // /////////////////////////////////////
  // Update global
  // /////////////////////////////////////

  const global = await Model.findOne({ globalType: globalConfig.slug });

  let result = rawVersion.version;

  if (global) {
    result = await Model.findOneAndUpdate(
      { globalType: globalConfig.slug },
      result,
      { new: true },
    );
  } else {
    result.globalType = globalConfig.slug;
    result = await Model.create(result);
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
      req,
    }) || result;
  }, Promise.resolve());

  return result;
}

export default restoreVersion;
