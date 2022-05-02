import { Payload } from '..';
import { enforceMaxVersions } from './enforceMaxVersions';
import { PayloadRequest } from '../express/types';
import { SanitizedGlobalConfig } from '../globals/config/types';
import sanitizeInternalFields from '../utilities/sanitizeInternalFields';
import { afterRead } from '../fields/hooks/afterRead';

type Args = {
  payload: Payload
  config?: SanitizedGlobalConfig
  req: PayloadRequest
  docWithLocales: any
}

export const saveGlobalVersion = async ({
  payload,
  config,
  req,
  docWithLocales,
}: Args): Promise<void> => {
  const VersionModel = payload.versions[config.slug];

  let version = docWithLocales;

  if (config.versions?.drafts) {
    const latestVersion = await VersionModel.findOne({
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

  version = await afterRead({
    depth: 0,
    doc: version,
    entityConfig: config,
    flattenLocales: false,
    overrideAccess: true,
    req,
    showHiddenFields: true,
  });

  if (version._id) delete version._id;

  let createdVersion;

  try {
    createdVersion = await VersionModel.create({
      version,
      autosave: false,
    });
  } catch (err) {
    payload.logger.error(`There was an error while saving a version for the Global ${config.label}.`);
    payload.logger.error(err);
  }

  if (config.versions.max) {
    enforceMaxVersions({
      payload: this,
      Model: VersionModel,
      entityLabel: config.label,
      entityType: 'global',
      max: config.versions.max,
    });
  }

  if (createdVersion) {
    createdVersion = JSON.parse(JSON.stringify(createdVersion));
    createdVersion = sanitizeInternalFields(createdVersion);
  }

  return createdVersion;
};
