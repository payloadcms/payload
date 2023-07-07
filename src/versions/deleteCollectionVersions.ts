import { Payload } from '../payload';

type Args = {
  payload: Payload
  slug: string
  id?: string | number
}

export const deleteCollectionVersions = async ({
  payload,
  slug,
  id,
}: Args): Promise<void> => {
  try {
    await payload.db.deleteVersions({
      collection: slug,
      where: {
        parent: {
          equals: id,
        },
      },
    });
  } catch (err) {
    payload.logger.error(`There was an error removing versions for the deleted ${slug} document with ID ${id}.`);
  }
};
