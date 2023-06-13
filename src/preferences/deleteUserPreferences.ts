import type { Payload } from '../index';
import type { Where } from '../types';
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
  const deletePreferencesWhere: Where = {
    or: [{
      key: {
        in: ids.map(
          (id) => `collection-${collectionConfig.slug}-${id}`,
        ),
      },
    }],
  };

  if (collectionConfig.auth) {
    deletePreferencesWhere.or.push({
      and: [
        {
          'user.value': {
            in: ids,
          },
        },
        {
          'user.relationTo': { equals: collectionConfig.slug },
        },
      ],
    });
  }

  payload.delete({
    collection: '_preferences',
    where: deletePreferencesWhere,
    overrideAccess: true,
  });
};
