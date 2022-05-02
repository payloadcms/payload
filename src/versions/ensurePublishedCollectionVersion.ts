import { Payload } from '..';
import { SanitizedCollectionConfig } from '../collections/config/types';
import { enforceMaxVersions } from './enforceMaxVersions';
import { PayloadRequest } from '../express/types';
import { afterRead } from '../fields/hooks/afterRead';

type Args = {
  payload: Payload
  config?: SanitizedCollectionConfig
  req: PayloadRequest
  docWithLocales: any
  id: string | number
}

export const ensurePublishedCollectionVersion = async ({
  payload,
  config,
  req,
  id,
  docWithLocales,
}: Args): Promise<void> => {
  // If there are no newer drafts,
  // And the current doc is published,
  // We need to keep a version of the published document

  if (docWithLocales?._status === 'published') {
    const VersionModel = payload.versions[config.slug];

    const moreRecentDrafts = await VersionModel.find({
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

    if (moreRecentDrafts?.length === 0) {
      const version = await afterRead({
        depth: 0,
        doc: docWithLocales,
        entityConfig: config,
        req,
        overrideAccess: true,
        showHiddenFields: true,
      });

      try {
        await VersionModel.create({
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
    }
  }
};
