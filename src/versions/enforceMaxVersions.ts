import { Payload } from '../payload';
import { CollectionModel } from '../collections/config/types';

type Args = {
  payload: Payload
  Model: CollectionModel
  max: number
  slug: string
  entityType: 'global' | 'collection'
  id?: string | number
}

export const enforceMaxVersions = async ({
  payload,
  Model,
  max,
  slug,
  entityType,
  id,
}: Args): Promise<void> => {
  try {
    const query: { parent?: string | number } = {};

    if (id) query.parent = id;

    const oldestAllowedDoc = await Model.find(query).limit(1).skip(max).sort({ updatedAt: -1 });

    if (oldestAllowedDoc?.[0]?.updatedAt) {
      await Model.deleteMany({
        $and: [
          {
            parent: id,
          },
          {
            updatedAt: {
              $lte: oldestAllowedDoc[0].updatedAt,
            },
          },
        ],
      });
    }
  } catch (err) {
    payload.logger.error(`There was an error cleaning up old versions for the ${entityType} ${slug}`);
  }
};
