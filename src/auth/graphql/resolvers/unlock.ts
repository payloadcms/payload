import { Payload } from '../../../index';
import unlock from '../../operations/unlock';
import { Collection } from '../../../collections/config/types';

function unlockResolver(payload: Payload, collection: Collection) {
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
