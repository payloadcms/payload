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
  autosave: boolean
}

export const saveCollectionDraft = async ({
  payload,
  config,
  id,
  data,
  autosave,
}: Args): Promise<void> => {
  const VersionsModel = payload.versions[config.slug] as CollectionModel;

  let existingAutosaveVersion;

  if (autosave) {
    existingAutosaveVersion = await VersionsModel.findOne({
      parent: id,
    }, {}, { sort: { updatedAt: 'desc' } });
  }

  let result;

  try {
    // If there is an existing autosave document,
    // Update it
    if (autosave && existingAutosaveVersion?.autosave === true) {
      result = await VersionsModel.findByIdAndUpdate(
        {
          _id: existingAutosaveVersion._id,
        },
        {
          version: data,
        },
        { new: true, lean: true },
      );
    // Otherwise, create a new one
    } else {
      result = await VersionsModel.create({
        parent: id,
        version: data,
        autosave: Boolean(autosave),
      });
    }
  } catch (err) {
    payload.logger.error(`There was an error while creating a draft ${config.labels.singular} with ID ${id}.`);
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
  result = JSON.stringify(result);
  result = JSON.parse(result);
  result.id = id;

  return result;
};
