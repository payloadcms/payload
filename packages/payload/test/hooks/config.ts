import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js';
import TransformHooks from './collections/Transform/index.js';
import Hooks, { hooksSlug } from './collections/Hook/index.js';
import NestedAfterReadHooks from './collections/NestedAfterReadHooks/index.js';
import ChainingHooks from './collections/ChainingHooks/index.js';
import Relations from './collections/Relations/index.js';
import AfterOperation from './collections/AfterOperation/index.js';
import Users, { seedHooksUsers } from './collections/Users/index.js';
import ContextHooks from './collections/ContextHooks/index.js';

export default buildConfigWithDefaults({
  collections: [
    AfterOperation,
    ContextHooks,
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
