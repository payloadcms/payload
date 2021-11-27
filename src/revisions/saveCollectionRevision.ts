import { Payload } from '..';
import { SanitizedCollectionConfig } from '../collections/config/types';
import { enforceMaxRevisions } from './enforceMaxRevisions';
import { PayloadRequest } from '../express/types';

type Args = {
  payload: Payload
  config?: SanitizedCollectionConfig
  req: PayloadRequest
  docWithLocales: any
  id: string | number
}

export const saveCollectionRevision = async ({
  payload,
  config,
  req,
  id,
  docWithLocales,
}: Args): Promise<void> => {
  const RevisionsModel = payload.revisions[config.slug];

  const revision = await payload.performFieldOperations(config, {
    id,
    depth: 0,
    req,
    data: docWithLocales,
    hook: 'afterRead',
    operation: 'update',
    overrideAccess: true,
    flattenLocales: false,
    showHiddenFields: true,
  });

  delete revision._id;

  try {
    await RevisionsModel.create({
      parent: id,
      revision,
    });
  } catch (err) {
    payload.logger.error(`There was an error while saving a revision for the ${config.labels.singular} with ID ${id}.`);
    payload.logger.error(err);
  }

  if (config.revisions.maxPerDoc) {
    enforceMaxRevisions({
      payload: this,
      Model: RevisionsModel,
      entityLabel: config.labels.plural,
      entityType: 'collection',
      maxPerDoc: config.revisions.maxPerDoc,
    });
  }
};
