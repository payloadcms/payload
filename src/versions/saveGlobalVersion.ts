import { Payload } from '..';
import { enforceMaxVersions } from './enforceMaxVersions';
import { PayloadRequest } from '../express/types';
import { SanitizedGlobalConfig } from '../globals/config/types';

type Args = {
  payload: Payload
  config?: SanitizedGlobalConfig
  req: PayloadRequest
  docWithLocales: any
  autosave?: boolean
}

export const saveGlobalVersion = async ({
  payload,
  config,
  req,
  docWithLocales,
  autosave,
}: Args): Promise<void> => {
  const VersionsModel = payload.versions[config.slug];

  const version = await payload.performFieldOperations(config, {
    depth: 0,
    req,
    data: docWithLocales,
    hook: 'afterRead',
    operation: 'update',
    overrideAccess: true,
    flattenLocales: false,
    showHiddenFields: true,
  });

  let existingAutosaveVersion;

  if (autosave) existingAutosaveVersion = await VersionsModel.findOne();

  try {
    // If there is an existing autosave document,
    // Update it
    if (existingAutosaveVersion?.autosave === true) {
      await VersionsModel.findByIdAndUpdate(
        { _id: existingAutosaveVersion._id },
        {
          version,
          autosave: Boolean(autosave),
        },
        { new: true },
      );
    // Otherwise, create a new one
    } else {
      await VersionsModel.create({
        version,
        autosave: Boolean(autosave),
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
};
