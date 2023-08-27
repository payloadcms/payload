import { CollectionPermission, GlobalPermission } from '../../../auth.js';
import { PayloadRequest } from '../../../express/types.js';
import { SanitizedGlobalConfig } from '../../config/types.js';
import { docAccess } from '../../operations/docAccess.js';

export type Resolver = (
  _: unknown,
  context: {
    req: PayloadRequest,
    res: Response
  }
) => Promise<CollectionPermission | GlobalPermission>

export function docAccessResolver(global: SanitizedGlobalConfig): Resolver {
  async function resolver(_, context) {
    return docAccess({
      req: context.req,
      globalConfig: global,
    });
  }

  return resolver;
}
