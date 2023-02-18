import { FilterQuery } from 'mongoose';
import { Payload } from '../payload';
import { SanitizedCollectionConfig, TypeWithID } from '../collections/config/types';
import { enforceMaxVersions } from './enforceMaxVersions';
import { PayloadRequest } from '../express/types';
import { SanitizedGlobalConfig } from '../globals/config/types';
import sanitizeInternalFields from '../utilities/sanitizeInternalFields';

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
  docWithLocales: doc,
  autosave,
  draft,
}: Args): Promise<TypeWithID> => {
  let result;
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

  const versionData = { ...doc };
  if (draft) versionData._status = 'draft';
  if (versionData._id) delete versionData._id;

  try {
    let createNewVersion = true;
    const now = new Date().toISOString();

    if (autosave) {
      const query: FilterQuery<unknown> = {};
      if (collection) query.parent = id;
      const latestVersion = await VersionModel.findOne(query, {}, { sort: { updatedAt: 'desc' } });

      // overwrite the latest version if it's set to autosave
      if (latestVersion?.autosave === true) {
        createNewVersion = false;

        const data: Record<string, unknown> = {
          version: versionData,
          createdAt: new Date(latestVersion.createdAt).toISOString(),
          updatedAt: draft ? now : new Date(doc.updatedAt).toISOString(),
        };

        result = await VersionModel.findByIdAndUpdate(
          {
            _id: latestVersion._id,
          },
          data,
          { new: true, lean: true },
        );
      }
    }

    if (createNewVersion) {
      const data: Record<string, unknown> = {
        autosave: Boolean(autosave),
        version: versionData,
        createdAt: doc?.createdAt ? new Date(doc.createdAt).toISOString() : now,
        updatedAt: draft ? now : new Date(doc.updatedAt).toISOString(),
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

  let max = 100;

  if (collection && typeof collection.versions.maxPerDoc === 'number') max = collection.versions.maxPerDoc;
  if (global && typeof global.versions.max === 'number') max = global.versions.max;

  if (max > 0) {
    await enforceMaxVersions({
      id,
      payload,
      Model: VersionModel,
      slug: entityConfig.slug,
      entityType,
      max,
    });
  }

  result = JSON.parse(JSON.stringify(result));

  let createdVersion = result.version;
  createdVersion.createdAt = result.createdAt;
  createdVersion.updatedAt = result.updatedAt;

  createdVersion = sanitizeInternalFields(createdVersion);
  createdVersion.id = id;

  return createdVersion;
};
