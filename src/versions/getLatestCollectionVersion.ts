import { docHasTimestamps } from '../types';
import { Payload } from '../payload';
import { CollectionModel, SanitizedCollectionConfig, TypeWithID } from '../collections/config/types';

type Args = {
  payload: Payload
  query: Record<string, unknown>
  lean?: boolean
  id: string | number
  Model: CollectionModel
  config: SanitizedCollectionConfig
}

export const getLatestCollectionVersion = async <T extends TypeWithID = any>({
  payload,
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

  const doc = await Model.findOne(query, {}, { lean });

  if (!latestVersion || (docHasTimestamps(doc) && latestVersion.updatedAt < doc.updatedAt)) {
    doc.id = doc._id;
    return doc;
  }

  return {
    ...latestVersion.version,
    id,
    updatedAt: latestVersion.updatedAt,
    createdAt: latestVersion.createdAt,
  };
};
