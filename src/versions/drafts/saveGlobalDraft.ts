import { Payload } from '../..';
import { enforceMaxVersions } from '../enforceMaxVersions';
import { SanitizedGlobalConfig } from '../../globals/config/types';

type Args = {
  payload: Payload
  config?: SanitizedGlobalConfig
  data: any
}

export const saveGlobalDraft = async ({
  payload,
  config,
  data,
}: Args): Promise<void> => {
  const VersionsModel = payload.versions[config.slug];

  const existingAutosaveVersion = await VersionsModel.findOne();

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
        version: data,
        autosave: true,
      });
    }
  } catch (err) {
    payload.logger.error(`There was an error while saving a version for the Global ${config.label}.`);
    payload.logger.error(err);
  }

  if (config.versions.max) {
    enforceMaxVersions({
      payload: this,
      Model: VersionsModel,
      entityLabel: config.label,
      entityType: 'global',
      maxPerDoc: config.versions.max,
    });
  }

  result = result.version;
  return result;
};
