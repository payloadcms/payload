import { AllOperations } from '../../types';
import { GlobalPermission } from '../../auth';
import type { PayloadRequest } from '../../express/types';
import { getEntityPolicies } from '../../utilities/getEntityPolicies';
import { SanitizedGlobalConfig } from '../config/types';

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
