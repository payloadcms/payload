import { AllOperations } from '../../types/index.js';
import { GlobalPermission } from '../../auth/types.js';
import type { PayloadRequest } from '../../express/types.js';
import { getEntityPolicies } from '../../utilities/getEntityPolicies.js';
import { SanitizedGlobalConfig } from '../config/types.js';

type Arguments = {
  req: PayloadRequest
  globalConfig: SanitizedGlobalConfig
}

export async function docAccess(args: Arguments): Promise<GlobalPermission> {
  const {
    req,
    globalConfig,
  } = args;

  const globalOperations: AllOperations[] = ['read', 'update'];

  if (globalConfig.versions) {
    globalOperations.push('readVersions');
  }

  return getEntityPolicies({
    type: 'global',
    req,
    entity: globalConfig,
    operations: globalOperations,
  });
}
