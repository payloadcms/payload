import { Document } from '../types';
import { Payload } from '../payload';
import { Collection, TypeWithID } from '../collections/config/types';

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
  const collection = await Model.findOne(query, {}, { lean }) as Document;
  version = await version;
  if (!version || version.updatedAt < collection.updatedAt) {
    return collection;
  }
  return {
    ...version.version,
    updatedAt: version.updatedAt,
    createdAt: version.createdAt,
  };
};
