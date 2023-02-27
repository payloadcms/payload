import { docHasTimestamps, Document } from '../types';
import { Payload } from '../payload';
import { CollectionModel, SanitizedCollectionConfig, TypeWithID } from '../collections/config/types';
import { GlobalModel, SanitizedGlobalConfig } from '../globals/config/types';

type Args = {
  payload: Payload
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
  entityType = 'collection',
  config,
  Model,
  query,
  id,
  lean = true,
}: Args): Promise<T> => {
  let latestVersion;

  if (config.versions?.drafts) {
    latestVersion = await payload.versions[config.slug].findOne({
      parent: id,
    }, {}, {
      sort: { updatedAt: 'desc' },
      lean,
    });
  }

  const doc = await (Model as any).findOne(query, {}, { lean }) as Document;

  if (!latestVersion || (docHasTimestamps(doc) && latestVersion.updatedAt < doc.updatedAt)) {
    if (entityType === 'collection') {
      doc.id = doc._id;
      return doc;
    }

    return {
      ...doc,
      _globalExists: Boolean(doc),
    };
  }

  return {
    ...latestVersion.version,
    ...(entityType === 'global' && { _globalExists: Boolean(doc) }),
    id,
    updatedAt: latestVersion.updatedAt,
    createdAt: latestVersion.createdAt,
  };
};
