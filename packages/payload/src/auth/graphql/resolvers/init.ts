import init from '../../operations/init';
import { Collection } from '../../../collections/config/types';

function initResolver(collection: Collection) {
  async function resolver(_, args, context) {
    const options = {
      Model: collection.Model,
      req: context.req,
    };

    const result = await init(options);

    return result;
  }

  return resolver;
}

export default initResolver;
