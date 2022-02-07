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

export const ensurePublishedGlobalVersion = async ({
  payload,
  config,
  req,
  docWithLocales,
}: Args): Promise<void> => {
  // If there are no newer drafts,
  // And the current doc is published,
  // We need to keep a version of the published document

  if (docWithLocales?._status === 'published') {
    const VersionModel = payload.versions[config.slug];

    const moreRecentDrafts = await VersionModel.find({
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
        await VersionModel.create({
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
    }
  }
};
