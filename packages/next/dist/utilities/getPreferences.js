import { cache } from 'react';
export const getPreferences = cache(async (key, payload, userID, userSlug) => {
  const result = await payload.find({
    collection: 'payload-preferences',
    depth: 0,
    limit: 1,
    pagination: false,
    where: {
      and: [{
        key: {
          equals: key
        }
      }, {
        'user.relationTo': {
          equals: userSlug
        }
      }, {
        'user.value': {
          equals: userID
        }
      }]
    }
  }).then(res => res.docs?.[0]);
  return result;
});
//# sourceMappingURL=getPreferences.js.map