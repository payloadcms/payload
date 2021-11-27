import { Payload } from '..';
import { CollectionModel } from '../collections/config/types';

type Args = {
  payload: Payload
  Model: CollectionModel
  maxPerDoc: number
  label: string
  entityType: 'global' | 'collection'
  revisionCreationPromise: Promise<any>
}

export const enforceMaxRevisions = async ({
  payload,
  Model,
  maxPerDoc,
  label,
  entityType,
  revisionCreationPromise,
}: Args): Promise<void> => {
  try {
    if (revisionCreationPromise) await revisionCreationPromise;

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
    payload.logger.error(`There was an error cleaning up old revisions for the ${entityType} ${label}`);
  }
};
