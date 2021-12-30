import { Payload } from '../..';
import { SanitizedCollectionConfig, CollectionModel } from '../../collections/config/types';
import { enforceMaxVersions } from '../enforceMaxVersions';
import { PayloadRequest } from '../../express/types';

type Args = {
  payload: Payload
  config?: SanitizedCollectionConfig
  req: PayloadRequest
  data: any
  id: string | number
}

export const saveCollectionDraft = async ({
  payload,
  config,
  id,
  data,
}: Args): Promise<void> => {
  const VersionsModel = payload.versions[config.slug] as CollectionModel;

  const existingAutosaveVersion = await VersionsModel.findOne({
    parent: id,
  }, {}, { sort: { updatedAt: 'desc' } });

  let result;

  try {
    // If there is an existing autosave document,
    // Update it
    if (existingAutosaveVersion?.autosave === true) {
      result = await VersionsModel.findByIdAndUpdate(
        {
          _id: existingAutosaveVersion._id,
        },
        {
          version: data,
          autosave: true,
        },
        { new: true, lean: true },
      );
    // Otherwise, create a new one
    } else {
      result = await VersionsModel.create({
        parent: id,
        version: data,
        autosave: true,
      });
    }
  } catch (err) {
    payload.logger.error(`There was an error while autosaving the ${config.labels.singular} with ID ${id}.`);
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

  result = result.version;
  result.id = id;

  return result;
};
