import { ClientSession } from 'mongoose';
import { Payload } from '../payload';

type Args = {
  payload: Payload
  session?: ClientSession
  slug: string
  id?: string | number
}

export const deleteCollectionVersions = async ({
  payload,
  session,
  slug,
  id,
}: Args): Promise<void> => {
  const VersionsModel = payload.versions[slug];

  try {
    await VersionsModel.deleteMany({
      parent: {
        $eq: id,
      },
    }, session ? { session } : undefined);
  } catch (err) {
    payload.logger.error(`There was an error removing versions for the deleted ${slug} document with ID ${id}.`);
  }
};
