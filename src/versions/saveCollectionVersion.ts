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
}

export const saveCollectionVersion = async ({
  payload,
  config,
  req,
  id,
  docWithLocales,
}: Args): Promise<void> => {
  const VersionModel = payload.versions[config.slug];

  let version = docWithLocales;

  if (config.versions?.drafts) {
    const latestVersion = await VersionModel.findOne({
      parent: {
        $eq: docWithLocales.id,
      },
      updatedAt: {
        $gt: docWithLocales.updatedAt,
      },
    },
    {},
    {
      lean: true,
      leanWithId: true,
      sort: {
        updatedAt: 'desc',
      },
    });

    if (latestVersion) {
      // If the latest version is a draft, no need to re-save it
      // Example: when "promoting" a draft to published, the draft already exists.
      // Instead, return null
      if (latestVersion?.version?._status === 'draft') {
        return null;
      }

      version = latestVersion.version;
      version = JSON.parse(JSON.stringify(version));
      version = sanitizeInternalFields(version);
    }
  }

  version = await payload.performFieldOperations(config, {
    id,
    depth: 0,
    req,
    data: version,
    hook: 'afterRead',
    operation: 'update',
    overrideAccess: true,
    flattenLocales: false,
    showHiddenFields: true,
  });

  if (version._id) delete version._id;

  let createdVersion;

  try {
    createdVersion = await VersionModel.create({
      parent: id,
      version,
      autosave: false,
    });
  } catch (err) {
    payload.logger.error(`There was an error while saving a version for the ${config.labels.singular} with ID ${id}.`);
    payload.logger.error(err);
  }

  if (config.versions.maxPerDoc) {
    enforceMaxVersions({
      id,
      payload: this,
      Model: VersionModel,
      entityLabel: config.labels.plural,
      entityType: 'collection',
      max: config.versions.maxPerDoc,
    });
  }

  if (createdVersion) {
    createdVersion = JSON.parse(JSON.stringify(createdVersion));
    createdVersion = sanitizeInternalFields(createdVersion);
  }

  return createdVersion;
};
