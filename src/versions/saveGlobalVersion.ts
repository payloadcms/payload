import { Payload } from '..';
import { enforceMaxVersions } from './enforceMaxVersions';
import { PayloadRequest } from '../express/types';
import { SanitizedGlobalConfig } from '../globals/config/types';

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

  try {
    await VersionsModel.create({
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
      Model: VersionsModel,
      entityLabel: config.label,
      entityType: 'global',
      maxPerDoc: config.versions.max,
    });
  }
};
