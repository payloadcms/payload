import type { SanitizedCollectionConfig, TypeWithID } from '../collections/config/types';
import type { FindOneArgs } from '../database/types';
import type { Payload } from '../payload';
import type { PayloadRequest } from '../types';
import type { TypeWithVersion } from './types';

import { docHasTimestamps } from '../types';

type Args = {
  config: SanitizedCollectionConfig;
  id: number | string;
  payload: Payload;
  query: FindOneArgs;
  req?: PayloadRequest
};

export const getLatestCollectionVersion = async <T extends TypeWithID = any>({
  config,
  id,
  payload,
  query,
  req,
}: Args): Promise<T> => {
  let latestVersion: TypeWithVersion<T>;

  if (config.versions?.drafts) {
    const { docs } = await payload.db.findVersions<T>({
      collection: config.slug,
      req,
      sort: '-updatedAt',
      where: { parent: { equals: id } },
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
    createdAt: latestVersion.createdAt,
    id,
    updatedAt: latestVersion.updatedAt,
  };
};
