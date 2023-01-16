import { Document } from '../types';
import { Payload } from '../payload';
import { Collection, TypeWithID } from '../collections/config/types';
import sanitizeInternalFields from '../utilities/sanitizeInternalFields';

type Args = {
  payload: Payload
  collection: Collection,
  query: Record<string, unknown>
  id: string | number
  lean?: boolean
}

export const getLatestCollectionVersion = async <T extends TypeWithID = any>({
  payload,
  collection: {
    config,
    Model,
  },
  query,
  id,
  lean = true,
}: Args): Promise<T> => {
  let version;
  if (config.versions?.drafts) {
    version = payload.versions[config.slug].findOne({
      parent: id,
    }, {}, {
      sort: { updatedAt: 'desc' },
      lean,
    });
  }
  let collection = await Model.findOne(query, {}, { lean }) as Document;
  version = await version;
  if (!version || version.updatedAt < collection.updatedAt) {
    collection.id = collection._id;
    collection = sanitizeInternalFields(collection);
    return collection;
  }
  return {
    ...version.version,
    id,
    updatedAt: version.updatedAt,
    createdAt: version.createdAt,
  };
};
