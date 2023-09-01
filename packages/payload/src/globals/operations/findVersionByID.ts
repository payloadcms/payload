/* eslint-disable no-underscore-dangle */
import type { FindGlobalVersionsArgs } from '../../database/types';
import type { PayloadRequest } from '../../express/types';
import type { TypeWithVersion } from '../../versions/types';
import type { SanitizedGlobalConfig } from '../config/types';

import executeAccess from '../../auth/executeAccess';
import { combineQueries } from '../../database/combineQueries';
import { Forbidden, NotFound } from '../../errors';
import { afterRead } from '../../fields/hooks/afterRead';
import { initTransaction } from '../../utilities/initTransaction';
import { killTransaction } from '../../utilities/killTransaction';

export type Arguments = {
  currentDepth?: number
  depth?: number
  disableErrors?: boolean
  globalConfig: SanitizedGlobalConfig
  id: number | string
  overrideAccess?: boolean
  req: PayloadRequest
  showHiddenFields?: boolean
}

async function findVersionByID<T extends TypeWithVersion<T> = any>(args: Arguments): Promise<T> {
  const {
    currentDepth,
    depth,
    disableErrors,
    globalConfig,
    id,
    overrideAccess,
    req: {
      locale,
      payload,
      t,
    },
    req,
    showHiddenFields,
  } = args;

  try {
    const shouldCommit = await initTransaction(req);

    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////

    const accessResults = !overrideAccess ? await executeAccess({ disableErrors, id, req }, globalConfig.access.readVersions) : true;

    // If errors are disabled, and access returns false, return null
    if (accessResults === false) return null;

    const hasWhereAccess = typeof accessResults === 'object';

    const findGlobalVersionsArgs: FindGlobalVersionsArgs = {
      global: globalConfig.slug,
      limit: 1,
      locale,
      req,
      where: combineQueries({ id: { equals: id } }, accessResults),
    };

    // /////////////////////////////////////
    // Find by ID
    // /////////////////////////////////////

    if (!findGlobalVersionsArgs.where.and[0].id) throw new NotFound(t);


    const { docs: results } = await payload.db.findGlobalVersions(findGlobalVersionsArgs);
    if (!results || results?.length === 0) {
      if (!disableErrors) {
        if (!hasWhereAccess) throw new NotFound(t);
        if (hasWhereAccess) throw new Forbidden(t);
      }

      return null;
    }


    // Clone the result - it may have come back memoized
    let result = JSON.parse(JSON.stringify(results[0]));

    // /////////////////////////////////////
    // beforeRead - Collection
    // /////////////////////////////////////

    await globalConfig.hooks.beforeRead.reduce(async (priorHook, hook) => {
      await priorHook;

      result = await hook({
        doc: result.version,
        req,
      }) || result.version;
    }, Promise.resolve());

    // /////////////////////////////////////
    // afterRead - Fields
    // /////////////////////////////////////

    result.version = await afterRead({
      context: req.context,
      currentDepth,
      depth,
      doc: result.version,
      entityConfig: globalConfig,
      overrideAccess,
      req,
      showHiddenFields,
    });

    // /////////////////////////////////////
    // afterRead - Global
    // /////////////////////////////////////

    await globalConfig.hooks.afterRead.reduce(async (priorHook, hook) => {
      await priorHook;

      result.version = await hook({
        doc: result.version,
        query: findGlobalVersionsArgs.where,
        req,
      }) || result.version;
    }, Promise.resolve());

    // /////////////////////////////////////
    // Return results
    // /////////////////////////////////////

    if (shouldCommit) await payload.db.commitTransaction(req.transactionID);

    return result;
  } catch (error: unknown) {
    await killTransaction(req);
    throw error;
  }
}

export default findVersionByID;
