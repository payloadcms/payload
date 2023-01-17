import { FilterQuery } from 'mongoose';
import { Payload } from '..';
import { SanitizedCollectionConfig } from '../collections/config/types';
import { enforceMaxVersions } from './enforceMaxVersions';
import { PayloadRequest } from '../express/types';
import sanitizeInternalFields from '../utilities/sanitizeInternalFields';
import { SanitizedGlobalConfig } from '../globals/config/types';

type Args = {
  payload: Payload
  global?: SanitizedGlobalConfig
  collection?: SanitizedCollectionConfig
  req: PayloadRequest
  docWithLocales: any
  id?: string | number
  autosave?: boolean
  draft?: boolean
}

export const saveVersion = async ({
  payload,
  collection,
  global,
  id,
  docWithLocales,
  autosave,
  draft,
}: Args): Promise<Record<string, unknown>> => {
  let entityConfig;
  if (collection) entityConfig = collection;
  if (global) entityConfig = global;

  const VersionModel = payload.versions[entityConfig.slug];

  const versionData = { ...docWithLocales };
  if (draft) versionData._status = 'draft';
  if (versionData._id) delete versionData._id;

  let existingAutosaveVersion;

  if (autosave) {
    const query: FilterQuery<unknown> = {};
    if (collection) query.parent = id;
    existingAutosaveVersion = await VersionModel.findOne(query, {}, { sort: { updatedAt: 'desc' } });
  }

  let result;

  try {
    if (autosave && existingAutosaveVersion?.autosave === true) {
      result = await VersionModel.findByIdAndUpdate(
        {
          _id: existingAutosaveVersion._id,
        },
        {
          version: versionData,
        },
        { new: true, lean: true },
      );
      // Otherwise, create a new one
    } else {
      const data: Record<string, unknown> = {
        version: versionData,
        autosave: Boolean(autosave),
      };

      if (collection) data.parent = id;

      result = await VersionModel.create(data);
    }
  } catch (err) {
    let errorMessage: string;

    if (collection) errorMessage = `There was an error while saving a version for the ${collection.labels.singular} with ID ${id}.`;
    if (global) errorMessage = `There was an error while saving a version for the global ${global.label}.`;
    payload.logger.error(errorMessage);
    payload.logger.error(err);
  }

  if (collection && collection.versions.maxPerDoc) {
    enforceMaxVersions({
      id,
      payload,
      Model: VersionModel,
      slug: entityConfig.slug,
      entityType: 'collection',
      max: collection.versions.maxPerDoc,
    });
  }

  result = result.version;
  result = JSON.parse(JSON.stringify(result));
  result = sanitizeInternalFields(result);
  result.id = id;

  return result;
};
