import { Payload } from '../..';
import { enforceMaxVersions } from '../enforceMaxVersions';
import { SanitizedGlobalConfig } from '../../globals/config/types';

type Args = {
  payload: Payload
  config?: SanitizedGlobalConfig
  data: any
  autosave: boolean
}

export const saveGlobalDraft = async ({
  payload,
  config,
  data,
  autosave,
}: Args): Promise<void> => {
  const VersionsModel = payload.versions[config.slug];

  let existingAutosaveVersion;

  if (autosave) {
    existingAutosaveVersion = await VersionsModel.findOne();
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
        version: data,
        autosave: Boolean(autosave),
      });
    }
  } catch (err) {
    payload.logger.error(`There was an error while saving a draft for the Global ${config.slug}.`);
    payload.logger.error(err);
  }

  if (config.versions.max) {
    enforceMaxVersions({
      payload: this,
      Model: VersionsModel,
      slug: config.slug,
      entityType: 'global',
      max: config.versions.max,
    });
  }

  result = result.version;
  result = JSON.stringify(result);
  result = JSON.parse(result);

  return result;
};
