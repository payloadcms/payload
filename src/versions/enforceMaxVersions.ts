import { ClientSession, FilterQuery } from 'mongoose';
import { Payload } from '../payload';
import { CollectionModel } from '../collections/config/types';

type Args = {
  payload: Payload
  session?: ClientSession
  Model: CollectionModel
  max: number
  slug: string
  entityType: 'global' | 'collection'
  id?: string | number
}

export const enforceMaxVersions = async ({
  payload,
  session,
  Model,
  max,
  slug,
  entityType,
  id,
}: Args): Promise<void> => {
  try {
    const sessionOpts = session ? { session } : undefined;

    const query: { parent?: string | number } = {};

    if (entityType === 'collection') query.parent = id;

    const oldestAllowedDoc = await Model
      .find(query, {}, sessionOpts)
      .limit(1)
      .skip(max)
      .sort({ updatedAt: -1 });

    if (oldestAllowedDoc?.[0]?.updatedAt) {
      const deleteQuery: FilterQuery<unknown> = {
        updatedAt: {
          $lte: oldestAllowedDoc[0].updatedAt,
        },
      };

      if (entityType === 'collection') deleteQuery.parent = id;

      await Model.deleteMany(deleteQuery, sessionOpts);
    }
  } catch (err) {
    payload.logger.error(`There was an error cleaning up old versions for the ${entityType} ${slug}`);
  }
};
