import type { Collection } from '../../../collections/config/types.js';

import unlock from '../../operations/unlock.js';

function unlockResolver(collection: Collection) {
  async function resolver(_, args, context) {
    const options = {
      collection,
      data: { email: args.email },
      req: context.req,
    };

    const result = await unlock(options);
    return result;
  }
  return resolver;
}

export default unlockResolver;
