import { buildConfig } from '../buildConfig';
import TransformHooks from './collections/Transform';
import Hooks, { hooksSlug } from './collections/Hook';
import NestedAfterReadHooks from './collections/NestedAfterReadHooks';
import ChainingHooks from './collections/ChainingHooks';
import Relations from './collections/Relations';
import Users, { seedHooksUsers } from './collections/Users';

export default buildConfig({
  collections: [
    TransformHooks,
    Hooks,
    NestedAfterReadHooks,
    ChainingHooks,
    Relations,
    Users,
  ],
  onInit: async (payload) => {
    await seedHooksUsers(payload);
    await payload.create({
      collection: hooksSlug,
      data: {
        check: 'update',
        fieldBeforeValidate: false,
        collectionBeforeValidate: false,
        fieldBeforeChange: false,
        collectionBeforeChange: false,
        fieldAfterChange: false,
        collectionAfterChange: false,
        collectionBeforeRead: false,
        fieldAfterRead: false,
        collectionAfterRead: false,
      },
    });
  },
});
