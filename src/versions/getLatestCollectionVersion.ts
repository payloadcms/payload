import { docHasTimestamps, Document } from '../types';
import { Payload } from '../payload';
import { CollectionModel, SanitizedCollectionConfig, TypeWithID } from '../collections/config/types';
import { GlobalModel, SanitizedGlobalConfig } from '../globals/config/types';
import { ClientSession } from 'mongoose';

type Args = {
  payload: Payload
  session?: ClientSession
  query: Record<string, unknown>
  lean?: boolean
} & ({
  entityType: 'global'
  id?: never
  Model: GlobalModel
  config: SanitizedGlobalConfig
} | {
  entityType?: 'collection'
  id: string | number
  Model: CollectionModel
  config: SanitizedCollectionConfig
})

export const getLatestEntityVersion = async <T extends TypeWithID = any>({
  payload,
  session,
  entityType = 'collection',
  config,
  Model,
  query,
  id,
  lean = true,
}: Args): Promise<T> => {
  const sessionOpts = session ? { session } : undefined;

  let latestVersion;

  if (config.versions?.drafts) {
    latestVersion = await payload.versions[config.slug].findOne({
      parent: id,
    }, {}, {
      sort: { updatedAt: 'desc' },
      lean,
      ...sessionOpts,
    });
  }

  const doc = await (Model as any).findOne(query, {}, {
    lean,
    ...sessionOpts,
  }) as Document;

  if (!latestVersion || (docHasTimestamps(doc) && latestVersion.updatedAt < doc.updatedAt)) {
    if (entityType === 'collection') {
      doc.id = doc._id;
      return doc;
    }
    return doc;
  }

  return {
    ...latestVersion.version,
    id,
    updatedAt: latestVersion.updatedAt,
    createdAt: latestVersion.createdAt,
  };
};
