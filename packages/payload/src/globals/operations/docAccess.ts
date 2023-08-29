import type { GlobalPermission } from '../../auth/types.js';
import type { PayloadRequest } from '../../express/types.js';
import type { AllOperations } from '../../types/index.js';
import type { SanitizedGlobalConfig } from '../config/types.js';

import { getEntityPolicies } from '../../utilities/getEntityPolicies.js';

type Arguments = {
  globalConfig: SanitizedGlobalConfig
  req: PayloadRequest
}

export async function docAccess(args: Arguments): Promise<GlobalPermission> {
  const {
    globalConfig,
    req,
  } = args;

  const globalOperations: AllOperations[] = ['read', 'update'];

  if (globalConfig.versions) {
    globalOperations.push('readVersions');
  }

  return getEntityPolicies({
    entity: globalConfig,
    operations: globalOperations,
    req,
    type: 'global',
  });
}
