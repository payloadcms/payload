import { Payload } from '..';
import { SanitizedCollectionConfig } from '../collections/config/types';
import { enforceMaxVersions } from './enforceMaxVersions';
import { PayloadRequest } from '../express/types';
import sanitizeInternalFields from '../utilities/sanitizeInternalFields';

type Args = {
  payload: Payload
  config?: SanitizedCollectionConfig
  req: PayloadRequest
  docWithLocales: any
  id: string | number
  autosave?: boolean
}

export const saveCollectionVersion = async ({
  payload,
  config,
  id,
  docWithLocales,
  autosave,
}: Args): Promise<Record<string, unknown>> => {
  const VersionModel = payload.versions[config.slug];

  let result = { ...docWithLocales };

  if (result._id) delete result._id;

  let existingAutosaveVersion;

  if (autosave) {
    existingAutosaveVersion = await VersionModel.findOne({
      parent: id,
    }, {}, { sort: { updatedAt: 'desc' } });
  }

  try {
    if (autosave && existingAutosaveVersion?.autosave === true) {
      result = await VersionModel.findByIdAndUpdate(
        {
          _id: existingAutosaveVersion._id,
        },
        {
          version: result,
        },
        { new: true, lean: true },
      );
      // Otherwise, create a new one
    } else {
      result = await VersionModel.create({
        parent: id,
        version: docWithLocales,
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
      payload,
      Model: VersionModel,
      slug: config.slug,
      entityType: 'collection',
      max: config.versions.maxPerDoc,
    });
  }

  result = result.version;
  result = JSON.parse(JSON.stringify(result));
  result = sanitizeInternalFields(result);
  result.id = id;

  return result;
};
