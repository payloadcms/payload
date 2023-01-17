import { FilterQuery } from 'mongoose';
import { Payload } from '..';
import { SanitizedCollectionConfig } from '../collections/config/types';
import { enforceMaxVersions } from './enforceMaxVersions';
import { PayloadRequest } from '../express/types';
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
}: Args): Promise<void> => {
  let entityConfig;
  let entityType: 'global' | 'collection';

  if (collection) {
    entityConfig = collection;
    entityType = 'collection';
  }

  if (global) {
    entityConfig = global;
    entityType = 'global';
  }

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

  try {
    if (autosave && existingAutosaveVersion?.autosave === true) {
      await VersionModel.findByIdAndUpdate(
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

      await VersionModel.create(data);
    }
  } catch (err) {
    let errorMessage: string;

    if (collection) errorMessage = `There was an error while saving a version for the ${collection.labels.singular} with ID ${id}.`;
    if (global) errorMessage = `There was an error while saving a version for the global ${global.label}.`;
    payload.logger.error(errorMessage);
    payload.logger.error(err);
  }

  let max: number;

  if (collection && typeof collection.versions.maxPerDoc === 'number') max = collection.versions.maxPerDoc;
  if (global && typeof global.versions.max === 'number') max = global.versions.max;

  if (collection && collection.versions.maxPerDoc) {
    enforceMaxVersions({
      id,
      payload,
      Model: VersionModel,
      slug: entityConfig.slug,
      entityType,
      max,
    });
  }
};
