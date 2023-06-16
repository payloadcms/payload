import type { Payload } from '../index';
import type { SanitizedCollectionConfig } from '../collections/config/types';

type Args = {
  payload: Payload
  /**
   * User IDs to delete
   */
  ids: (string|number)[]
  collectionConfig: SanitizedCollectionConfig
}
export const deleteUserPreferences = ({ payload, ids, collectionConfig }: Args) => {
  if (collectionConfig.auth) {
    payload.collections['payload-preferences'].Model.deleteMany({
      user: { in: ids },
      userCollection: collectionConfig.slug,
    });
  }
  payload.collections['payload-preferences'].Model.deleteMany({ key: { in: ids.map((id) => `collection-${collectionConfig.slug}-${id}`) } });
};
