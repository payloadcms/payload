/* eslint-disable no-underscore-dangle */
import memoize from 'micro-memoize';

import type { FindOneArgs } from '../../database/types';
import type { PayloadRequest } from '../../express/types';
import type { Collection, TypeWithID } from '../config/types';

import executeAccess from '../../auth/executeAccess';
import { combineQueries } from '../../database/combineQueries';
import { NotFound } from '../../errors';
import { afterRead } from '../../fields/hooks/afterRead';
import { initTransaction } from '../../utilities/initTransaction';
import { killTransaction } from '../../utilities/killTransaction';
import replaceWithDraftIfAvailable from '../../versions/drafts/replaceWithDraftIfAvailable';
import { buildAfterOperation } from './utils';

export type Arguments = {
  collection: Collection
  currentDepth?: number
  depth?: number
  disableErrors?: boolean
  draft?: boolean
  id: number | string
  overrideAccess?: boolean
  req: PayloadRequest
  showHiddenFields?: boolean
}

async function findByID<T extends TypeWithID>(
  incomingArgs: Arguments,
): Promise<T> {
  let args = incomingArgs;

  // /////////////////////////////////////
  // beforeOperation - Collection
  // /////////////////////////////////////

  await args.collection.config.hooks.beforeOperation.reduce(async (priorHook, hook) => {
    await priorHook;

    args = (await hook({
      args,
      context: args.req.context,
      operation: 'read',
    })) || args;
  }, Promise.resolve());

  const {
    collection: {
      config: collectionConfig,
    },
    currentDepth,
    depth,
    disableErrors,
    draft: draftEnabled = false,
    id,
    overrideAccess = false,
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
    const { transactionID } = req;

    // /////////////////////////////////////
    // beforeOperation - Collection
    // /////////////////////////////////////

    await args.collection.config.hooks.beforeOperation.reduce(async (priorHook, hook) => {
      await priorHook;

      args = (await hook({
        args,
        context: req.context,
        operation: 'read',
      })) || args;
    }, Promise.resolve());

    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////

    const accessResult = !overrideAccess ? await executeAccess({ disableErrors, id, req }, collectionConfig.access.read) : true;

    // If errors are disabled, and access returns false, return null
    if (accessResult === false) return null;


    const findOneArgs: FindOneArgs = {
      collection: collectionConfig.slug,
      locale,
      req: {
        transactionID: req.transactionID,
      } as PayloadRequest,
      where: combineQueries({ id: { equals: id } }, accessResult),
    };

    // /////////////////////////////////////
    // Find by ID
    // /////////////////////////////////////

    if (!findOneArgs.where.and[0].id) throw new NotFound(t);

    if (!req.findByID) req.findByID = { [transactionID]: {} };

    if (!req.findByID[transactionID][collectionConfig.slug]) {
      const nonMemoizedFindByID = async (query: FindOneArgs) => req.payload.db.findOne(query);

      req.findByID[transactionID][collectionConfig.slug] = memoize(nonMemoizedFindByID, {
        isPromise: true,
        maxSize: 100,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore This is straight from their docs, bad typings
        transformKey: JSON.stringify,
      });
    }

    let result = await req.findByID[transactionID][collectionConfig.slug](findOneArgs) as T;

    if (!result) {
      if (!disableErrors) {
        throw new NotFound(t);
      }

      return null;
    }

    // Clone the result - it may have come back memoized
    result = JSON.parse(JSON.stringify(result));


    // /////////////////////////////////////
    // Replace document with draft if available
    // /////////////////////////////////////

    if (collectionConfig.versions?.drafts && draftEnabled) {
      result = await replaceWithDraftIfAvailable({
        accessResult,
        doc: result,
        entity: collectionConfig,
        entityType: 'collection',
        overrideAccess,
        req,
      });
    }

    // /////////////////////////////////////
    // beforeRead - Collection
    // /////////////////////////////////////

    await collectionConfig.hooks.beforeRead.reduce(async (priorHook, hook) => {
      await priorHook;

      result = await hook({
        context: req.context,
        doc: result,
        query: findOneArgs.where,
        req,
      }) || result;
    }, Promise.resolve());

    // /////////////////////////////////////
    // afterRead - Fields
    // /////////////////////////////////////

    result = await afterRead({
      context: req.context,
      currentDepth,
      depth,
      doc: result,
      entityConfig: collectionConfig,
      overrideAccess,
      req,
      showHiddenFields,
    });

    // /////////////////////////////////////
    // afterRead - Collection
    // /////////////////////////////////////

    await collectionConfig.hooks.afterRead.reduce(async (priorHook, hook) => {
      await priorHook;

      result = await hook({
        context: req.context,
        doc: result,
        query: findOneArgs.where,
        req,
      }) || result;
    }, Promise.resolve());

    // /////////////////////////////////////
    // afterOperation - Collection
    // /////////////////////////////////////

    result = await buildAfterOperation<T>({
      args,
      operation: 'findByID',
      result: result as any,
    }); // TODO: fix this typing

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

export default findByID;
