import type { Payload } from '..';

const docWithFilenameExists = async (payload: Payload, collectionSlug: string, path: string, filename: string): Promise<boolean> => {
  const doc = await payload.db.findOne({
    collection: collectionSlug,
    where: {
      filename: {
        equals: filename,
      },
    },
  });
  if (doc) return true;

  return false;
};

export default docWithFilenameExists;
