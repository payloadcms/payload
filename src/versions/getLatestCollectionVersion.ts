import { Where, docHasTimestamps } from '../types';
import { Payload } from '../payload';
import { CollectionModel, SanitizedCollectionConfig, TypeWithID } from '../collections/config/types';
import { TypeWithVersion } from './types';
import { FindArgs } from '../database/types';

type Args = {
  payload: Payload
  query: FindArgs
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
  let latestVersion: TypeWithVersion<T>;

  if (config.versions?.drafts) {
    const { docs } = await payload.db.findVersions<T>({
      collection: config.slug,
      where: { parent: { equals: id } },
      sortProperty: 'updatedAt',
      sortOrder: 'desc',
    });
    [latestVersion] = docs;
  }

  const { docs } = await payload.db.find<T>(query);
  const [doc] = docs;


  if (!latestVersion || (docHasTimestamps(doc) && latestVersion.updatedAt < doc.updatedAt)) {
    return doc;
  }

  return {
    ...latestVersion.version,
    id,
    updatedAt: latestVersion.updatedAt,
    createdAt: latestVersion.createdAt,
  };
};
