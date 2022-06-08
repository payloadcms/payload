import { Collection } from '../../../collections/config/types';
import logout from '../../operations/logout';

function logoutResolver(collection: Collection): any {
  async function resolver(_, args, context) {
    const options = {
      collection,
      res: context.res,
      req: context.req,
    };

    const result = await logout(options);

    return result;
  }

  return resolver;
}

export default logoutResolver;
