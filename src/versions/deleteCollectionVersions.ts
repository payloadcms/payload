import { Payload } from '../payload';
import { PayloadRequest } from '../express/types';

type Args = {
  payload: Payload
  slug: string
  id?: string | number
  req?: PayloadRequest
}

export const deleteCollectionVersions = async ({
  payload,
  slug,
  id,
  req,
}: Args): Promise<void> => {
  try {
    await payload.db.deleteVersions({
      collection: slug,
      where: {
        parent: {
          equals: id,
        },
      },
      req,
    });
  } catch (err) {
    payload.logger.error(`There was an error removing versions for the deleted ${slug} document with ID ${id}.`);
  }
};
