import DataLoader, { BatchLoadFn } from 'dataloader';
import { ObjectId } from 'mongoose';
import { PayloadRequest } from '../express/types';
import { TypeWithID } from './config/types';
import { isValidID } from '../utilities/isValidID';
import { getIDType } from '../utilities/getIDType';
import { fieldAffectsData } from '../fields/config/types';

// Payload uses `dataloader` to solve the classic GraphQL N+1 problem.

// We keep a list of all documents requested to be populated for any given request
// and then batch together documents within the same collection,
// making only 1 find per each collection, rather than `findByID` per each requested doc.

// This dramatically improves performance for REST and Local API `depth` populations,
// and also ensures complex GraphQL queries perform lightning-fast.

const batchAndLoadDocs = (req: PayloadRequest): BatchLoadFn<string, TypeWithID> => async (keys: string[]): Promise<TypeWithID[]> => {
  const { payload } = req;
  // Batch IDs by their `find` args
  // so we can make one find query per combination of collection, depth, locale, and fallbackLocale.

  // Resulting shape will be as follows:
  // {
  //   // key is stringified set of find args
  //   '["pages",2,0,"es","en",false,false]': [
  //     // value is array of ID, key, resolve, reject to find with these args
  //     {id: 'q34tl23462346234524', key: '["pages",'q34tl23462346234524',2,0,"es","en",false,false]', resolve: [Function], reject: [Function]},
  //     {id: '435523540194324280', key: '["pages",'435523540194324280',2,0,"es","en",false,false]', resolve: [Function], reject: [Function]},
  //     {id: '2346245j35l3j5234532li', key: '["pages",'2346245j35l3j5234532li',2,0,"es","en",false,false]', resolve: [Function], reject: [Function]},
  //   ],
  //   // etc
  // };

  const results: (Promise<TypeWithID>)[] = [];
  const batchByFindArgs = keys.reduce<Record<string, Array<{ id: string; key: string; resolve:(value: TypeWithID) => void; reject: (reason?: any) => void}>>>((batches, key) => {
    const [collection, id, depth, currentDepth, locale, fallbackLocale, overrideAccess, showHiddenFields] = JSON.parse(key);

    const batchKeyArray = [
      collection,
      depth,
      currentDepth,
      locale,
      fallbackLocale,
      overrideAccess,
      showHiddenFields,
    ];

    const batchKey = JSON.stringify(batchKeyArray);
    let res: (value: TypeWithID) => void;
    let rej: (reason?: any) => void;
    results.push(new Promise<TypeWithID>((resolve, reject) => {
      res = resolve;
      rej = reject;
    }));
    // eslint-disable-next-line no-param-reassign
    batches[batchKey] = [
      ...batches[batchKey] || [],
      {
        id,
        key,
        resolve: res,
        reject: rej,
      },
    ];
    return batches;
  }, {});

  // Run find requests in parallel
  Object.entries(batchByFindArgs).forEach(async ([batchKey, ids]) => {
    try {
      const [collection, depth, currentDepth, locale, fallbackLocale, overrideAccess, showHiddenFields] = JSON.parse(batchKey);

      // copy req object to avoid mutating it
      // override payloadDataLoader to prevent infinite recursion

      const result = await payload.find({
        collection,
        locale,
        fallbackLocale,
        depth,
        currentDepth,
        pagination: false,
        where: {
          id: {
            in: ids.map(({ id }) => id),
          },
        },
        overrideAccess: Boolean(overrideAccess),
        showHiddenFields: Boolean(showHiddenFields),
        disableErrors: true,
        req,
      });

      const keyToDoc = result.docs.reduce<Record<string, TypeWithID>>((map, doc) => {
        const key = stringifyLoadArgs({
          collection,
          id: doc.id,
          depth,
          currentDepth,
          locale,
          fallbackLocale,
          overrideAccess,
          showHiddenFields,
        });
        // eslint-disable-next-line no-param-reassign
        map[key] = doc;
        return map;
      }, {});

      ids.forEach(({ key, resolve }) => {
        const doc = keyToDoc[key];
        if (doc) {
          resolve(doc);
        } else {
          resolve(null);
        }
      });
    } catch (error) {
      // reject all promises in this batch
      ids.forEach(({ reject }) => {
        reject(error);
      });
    }
  });
  const timeoutId = setTimeout(() => {
    // reject all promises after 30 seconds
    Object.entries(batchByFindArgs).forEach(([, ids]) => {
      ids.forEach(({ reject }) => {
        reject(new Error('Data loader timed out'));
      });
    });
  }, 30_000);

  // Wait for all promises to resolve or reject
  Promise.allSettled(results).then(() => {
    clearTimeout(timeoutId);
  });

  // Return array of promises
  // dataload supports promises as values
  // but has a wrong type definition
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - dataloader has wrong type definition
  return results;
};

export type LoadArgs = string | {
  collection: string;
  id: string | number;
  depth: number;
  currentDepth: number;
  locale: string;
  fallbackLocale: string;
  overrideAccess: boolean;
  showHiddenFields: boolean;
}

function stringifyLoadArgs(args: LoadArgs): string {
  if (typeof args === 'string') {
    return args;
  }
  const { collection, id, depth, currentDepth, locale, fallbackLocale, overrideAccess, showHiddenFields } = args;
  return JSON.stringify([collection, id, depth, currentDepth, locale, fallbackLocale, overrideAccess, showHiddenFields]);
}

export const getDataLoader = (req: PayloadRequest) => {
  const dataloader = new DataLoader(batchAndLoadDocs(req));

  const { payload } = req;
  // wrap the load function to ensure we always stringify the key
  // with the correct fields
  // we also need to check if the id is valid
  // for backwards compatibility we need to support strings as well
  function load(key: LoadArgs): Promise<TypeWithID> {
    let collection: string;
    let id: string | number;
    if (typeof key === 'string') {
      [collection, id] = JSON.parse(key);
    } else {
      ({ collection, id } = key);
    }
    const idField = payload.collections?.[collection].config.fields.find((field) => fieldAffectsData(field) && field.name === 'id');
    if (!isValidID(id, getIDType(idField))) {
      // should probably throw an error here, but this would be a breaking change
      // throw new Error(`Invalid ID ${id} for collection ${collection}`);
      return null;
    }
    return dataloader.load(stringifyLoadArgs(key));
  }

  return {
    load,
    loadAll: (keys: Array<LoadArgs>) => Promise.all(keys.map(load)),
    clear: dataloader.clear,
    clearAll: dataloader.clearAll,
    prime: dataloader.prime,
  };
};
