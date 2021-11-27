import { Payload } from '..';
import { enforceMaxRevisions } from './enforceMaxRevisions';
import { PayloadRequest } from '../express/types';
import { SanitizedGlobalConfig } from '../globals/config/types';

type Args = {
  payload: Payload
  config?: SanitizedGlobalConfig
  req: PayloadRequest
  docWithLocales: any
}

export const saveGlobalRevision = async ({
  payload,
  config,
  req,
  docWithLocales,
}: Args): Promise<void> => {
  const RevisionsModel = payload.revisions[config.slug];

  const revision = await payload.performFieldOperations(config, {
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
    await RevisionsModel.create({
      revision,
    });
  } catch (err) {
    payload.logger.error(`There was an error while saving a revision for the Global ${config.label}.`);
    payload.logger.error(err);
  }

  if (config.revisions.max) {
    enforceMaxRevisions({
      payload: this,
      Model: RevisionsModel,
      entityLabel: config.label,
      entityType: 'global',
      maxPerDoc: config.revisions.max,
    });
  }
};
