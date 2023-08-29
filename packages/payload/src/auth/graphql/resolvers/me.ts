import type { Collection } from '../../../collections/config/types.js';

import me from '../../operations/me.js';

function meResolver(collection: Collection): any {
  async function resolver(_, args, context) {
    const options = {
      collection,
      depth: 0,
      req: context.req,
    };
    return me(options);
  }
  return resolver;
}

export default meResolver;
