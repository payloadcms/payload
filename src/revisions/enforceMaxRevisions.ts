import { GlobalModel } from '../globals/config/types';
import { Payload } from '..';
import { CollectionModel } from '../collections/config/types';

type Args = {
  payload: Payload
  Model: CollectionModel | GlobalModel
  maxPerDoc: number
  entityLabel: string
  entityType: 'global' | 'collection'
}

export const enforceMaxRevisions = async ({
  payload,
  Model,
  maxPerDoc,
  entityLabel,
  entityType,
}: Args): Promise<void> => {
  try {
    const oldestAllowedDoc = await Model.find().limit(1).skip(maxPerDoc).sort({ createdAt: -1 });

    if (oldestAllowedDoc?.[0]?.createdAt) {
      const deleteLessThan = oldestAllowedDoc[0].createdAt;

      await Model.deleteMany({
        createdAt: {
          $lte: deleteLessThan,
        },
      });
    }
  } catch (err) {
    payload.logger.error(`There was an error cleaning up old revisions for the ${entityType} ${entityLabel}`);
  }
};
