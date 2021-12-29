import { Payload } from '..';
import { SanitizedCollectionConfig } from '../collections/config/types';
import { enforceMaxVersions } from './enforceMaxVersions';
import { PayloadRequest } from '../express/types';

type Args = {
  payload: Payload
  config?: SanitizedCollectionConfig
  req: PayloadRequest
  docWithLocales: any
  id: string | number
  autosave: boolean
}

export const saveCollectionVersion = async ({
  payload,
  config,
  req,
  id,
  docWithLocales,
  autosave,
}: Args): Promise<void> => {
  const VersionsModel = payload.versions[config.slug];

  const version = await payload.performFieldOperations(config, {
    id,
    depth: 0,
    req,
    data: docWithLocales,
    hook: 'afterRead',
    operation: 'update',
    overrideAccess: true,
    flattenLocales: false,
    showHiddenFields: true,
  });

  delete version._id;

  let existingAutosaveVersion;

  if (autosave) {
    existingAutosaveVersion = await VersionsModel.findOne({
      parent: id,
    });
  }

  try {
    // If there is an existing autosave document,
    // Update it
    if (existingAutosaveVersion?.autosave === true) {
      await VersionsModel.findByIdAndUpdate(
        {
          _id: existingAutosaveVersion._id,
        },
        {
          version,
          autosave: Boolean(autosave),
        },
        { new: true },
      );
    // Otherwise, create a new one
    } else {
      await VersionsModel.create({
        parent: id,
        version,
        autosave: Boolean(autosave),
      });
    }
  } catch (err) {
    payload.logger.error(`There was an error while saving a version for the ${config.labels.singular} with ID ${id}.`);
    payload.logger.error(err);
  }

  if (config.versions.maxPerDoc) {
    enforceMaxVersions({
      id,
      payload: this,
      Model: VersionsModel,
      entityLabel: config.labels.plural,
      entityType: 'collection',
      maxPerDoc: config.versions.maxPerDoc,
    });
  }
};
