import qs from 'qs';
import { Where } from '../../../../../types';
import { PaginatedDocs } from '../../../../../mongoose/types';
import { SanitizedCollectionConfig } from '../../../../../collections/config/types';
import { createRelationMap } from './createRelationMap';
import { Action } from './types';

type GetResults = (args: {
  collections: SanitizedCollectionConfig[]
  dispatchOptions: (value: Action) => void
  errorLoading: string
  hasMany: boolean
  lastFullyLoadedRelation?: number
  lastLoadedPage?: number
  relationTo: string | string[]
  search: string
  sort: boolean
  url: string
  value: unknown
  setErrorLoading: (error: string) => void
  setLastLoadedPage: (page: number) => void
  setLastFullyLoadedRelation: (relation: number) => void
}) => Promise<void>

const maxResultsPerRequest = 10;

export const getResults: GetResults = async ({
  collections,
  dispatchOptions,
  errorLoading,
  hasMany,
  lastFullyLoadedRelation: lastFullyLoadedRelationArg,
  lastLoadedPage: lastLoadedPageArg,
  relationTo,
  search,
  setErrorLoading,
  setLastFullyLoadedRelation,
  setLastLoadedPage,
  sort,
  url,
  value,
}) => {
  const hasMultipleRelations = Array.isArray(relationTo);
  let lastLoadedPageToUse = typeof lastLoadedPageArg !== 'undefined' ? lastLoadedPageArg : 1;
  const lastFullyLoadedRelationToUse = typeof lastFullyLoadedRelationArg !== 'undefined' ? lastFullyLoadedRelationArg : -1;

  const relations = Array.isArray(relationTo) ? relationTo : [relationTo];
  const relationsToFetch = lastFullyLoadedRelationToUse === -1 ? relations : relations.slice(lastFullyLoadedRelationToUse + 1);

  let resultsFetched = 0;
  const relationMap = createRelationMap({ hasMany, relationTo, value });

  if (!errorLoading) {
    relationsToFetch.reduce(async (priorRelation, relation) => {
      await priorRelation;

      if (resultsFetched < 10) {
        const collection = collections.find((coll) => coll.slug === relation);
        const fieldToSearch = collection?.admin?.useAsTitle || 'id';

        const query: {
          [key: string]: unknown
          where: Where
        } = {
          where: {},
          limit: maxResultsPerRequest,
          page: lastLoadedPageToUse,
          sort: fieldToSearch,
          depth: 0,
        };

        if (search) {
          query.where[fieldToSearch] = {
            like: search,
          };
        } else {
          query.where.id = {
            not_in: relationMap[relation],
          };
        }

        const response = await fetch(`${url}/${relation}?${qs.stringify(query)}`);

        if (response.ok) {
          const data: PaginatedDocs<unknown> = await response.json();
          if (data.docs.length > 0) {
            resultsFetched += data.docs.length;
            dispatchOptions({ type: 'ADD', data, relation, hasMultipleRelations, collection, sort });
            setLastLoadedPage(data.page);

            if (!data.nextPage) {
              setLastFullyLoadedRelation(relations.indexOf(relation));

              // If there are more relations to search, need to reset lastLoadedPage to 1
              // both locally within function and state
              if (relations.indexOf(relation) + 1 < relations.length) {
                lastLoadedPageToUse = 1;
              }
            }
          }
        } else {
          setErrorLoading('An error has occurred.');
        }
      }
    }, Promise.resolve());
  }
};
