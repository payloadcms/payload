import type { CollectionPermission, GlobalPermission } from '../../../auth/types.js';
import type { PayloadRequest } from '../../../express/types.js';
import type { SanitizedGlobalConfig } from '../../config/types.js';

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
      globalConfig: global,
      req: context.req,
    });
  }

  return resolver;
}
