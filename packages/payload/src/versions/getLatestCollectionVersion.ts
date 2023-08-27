import { docHasTimestamps, PayloadRequest } from '../types.js';
import { Payload } from '../payload.js';
import { SanitizedCollectionConfig, TypeWithID } from '../collections/config/types.js';
import { TypeWithVersion } from './types.js';
import type { FindOneArgs } from '../database/types.js';

type Args = {
  payload: Payload;
  query: FindOneArgs;
  id: string | number;
  config: SanitizedCollectionConfig;
  req?: PayloadRequest
};

export const getLatestCollectionVersion = async <T extends TypeWithID = any>({
  payload,
  config,
  query,
  id,
  req,
}: Args): Promise<T> => {
  let latestVersion: TypeWithVersion<T>;

  if (config.versions?.drafts) {
    const { docs } = await payload.db.findVersions<T>({
      collection: config.slug,
      where: { parent: { equals: id } },
      sort: '-updatedAt',
      req,
    });
    [latestVersion] = docs;
  }

  const doc = await payload.db.findOne<T>({ ...query, req });

  if (
    !latestVersion
    || (docHasTimestamps(doc) && latestVersion.updatedAt < doc.updatedAt)
  ) {
    return doc;
  }

  return {
    ...latestVersion.version,
    id,
    updatedAt: latestVersion.updatedAt,
    createdAt: latestVersion.createdAt,
  };
};
