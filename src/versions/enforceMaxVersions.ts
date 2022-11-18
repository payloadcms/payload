import { Payload } from '..';
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

    const oldestAllowedDoc = await Model.find(query).limit(1).skip(max).sort({ createdAt: -1 });

    if (oldestAllowedDoc?.[0]?.createdAt) {
      const deleteLessThan = oldestAllowedDoc[0].createdAt;

      await Model.deleteMany({
        createdAt: {
          $lte: deleteLessThan,
        },
      });
    }
  } catch (err) {
    payload.logger.error(`There was an error cleaning up old versions for the ${entityType} ${slug}`);
  }
};
