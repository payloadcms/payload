import type { NextFunction, Response } from 'express';

import httpStatus from 'http-status';

import type { CollectionPermission, GlobalPermission } from '../../auth/types.js';
import type { PayloadRequest } from '../../express/types.js';
import type { SanitizedGlobalConfig } from '../config/types.js';

import { docAccess } from '../operations/docAccess.js';

export default async function docAccessRequestHandler(req: PayloadRequest, res: Response, next: NextFunction, globalConfig: SanitizedGlobalConfig): Promise<Response<CollectionPermission | GlobalPermission> | void> {
  try {
    const accessResults = await docAccess({
      globalConfig,
      req,
    });

    return res.status(httpStatus.OK).json(accessResults);
  } catch (error) {
    return next(error);
  }
}
