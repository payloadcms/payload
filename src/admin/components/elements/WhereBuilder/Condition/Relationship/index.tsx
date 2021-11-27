import React, { useReducer, useState, useCallback, useEffect } from 'react';
import { useConfig } from '@payloadcms/config-provider';
import { Props, Option, ValueWithRelation } from './types';
import optionsReducer from './optionsReducer';
import useDebounce from '../../../../../hooks/useDebounce';
import ReactSelect from '../../../ReactSelect';
import { Value } from '../../../ReactSelect/types';
import { PaginatedDocs } from '../../../../../../mongoose/types';

import './index.scss';

const baseClass = 'condition-value-relationship';

const maxResultsPerRequest = 10;

const RelationshipField: React.FC<Props> = (props) => {
  const { onChange, value, relationTo, hasMany } = props;

  const {
    serverURL,
    routes: {
      api,
    },
    collections,
  } = useConfig();

  const hasMultipleRelations = Array.isArray(relationTo);
  const [options, dispatchOptions] = useReducer(optionsReducer, []);
  const [lastFullyLoadedRelation, setLastFullyLoadedRelation] = useState(-1);
  const [lastLoadedPage, setLastLoadedPage] = useState(1);
  const [search, setSearch] = useState('');
  const [errorLoading, setErrorLoading] = useState('');
  const [hasLoadedFirstOptions, setHasLoadedFirstOptions] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const addOptions = useCallback((data, relation) => {
    const collection = collections.find((coll) => coll.slug === relation);
    dispatchOptions({ type: 'ADD', data, relation, hasMultipleRelations, collection });
  }, [collections, hasMultipleRelations]);

  const getResults = useCallback(async ({
    lastFullyLoadedRelation: lastFullyLoadedRelationArg,
    lastLoadedPage: lastLoadedPageArg,
    search: searchArg,
  }) => {
    let lastLoadedPageToUse = typeof lastLoadedPageArg !== 'undefined' ? lastLoadedPageArg : 1;
    const lastFullyLoadedRelationToUse = typeof lastFullyLoadedRelationArg !== 'undefined' ? lastFullyLoadedRelationArg : -1;

    const relations = Array.isArray(relationTo) ? relationTo : [relationTo];
    const relationsToFetch = lastFullyLoadedRelationToUse === -1 ? relations : relations.slice(lastFullyLoadedRelationToUse + 1);

    let resultsFetched = 0;

    if (!errorLoading) {
      relationsToFetch.reduce(async (priorRelation, relation) => {
        await priorRelation;

        if (resultsFetched < 10) {
          const collection = collections.find((coll) => coll.slug === relation);
          const fieldToSearch = collection?.admin?.useAsTitle || 'id';
          const searchParam = searchArg ? `&where[${fieldToSearch}][like]=${searchArg}` : '';

          const response = await fetch(`${serverURL}${api}/${relation}?limit=${maxResultsPerRequest}&page=${lastLoadedPageToUse}&depth=0${searchParam}`);

          if (response.ok) {
            const data: PaginatedDocs<any> = await response.json();
            if (data.docs.length > 0) {
              resultsFetched += data.docs.length;
              addOptions(data, relation);
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
  }, [addOptions, api, collections, serverURL, errorLoading, relationTo]);

  const findOptionsByValue = useCallback((): Option | Option[] => {
    if (value) {
      if (hasMany) {
        if (Array.isArray(value)) {
          return value.map((val) => {
            if (hasMultipleRelations) {
              let matchedOption: Option;

              options.forEach((opt) => {
                if (opt.options) {
                  opt.options.some((subOpt) => {
                    if (subOpt?.value === val.value) {
                      matchedOption = subOpt;
                      return true;
                    }

                    return false;
                  });
                }
              });

              return matchedOption;
            }

            return options.find((opt) => opt.value === val);
          });
        }

        return undefined;
      }

      if (hasMultipleRelations) {
        let matchedOption: Option;

        const valueWithRelation = value as ValueWithRelation;

        options.forEach((opt) => {
          if (opt?.options) {
            opt.options.some((subOpt) => {
              if (subOpt?.value === valueWithRelation.value) {
                matchedOption = subOpt;
                return true;
              }
              return false;
            });
          }
        });

        return matchedOption;
      }

      return options.find((opt) => opt.value === value);
    }

    return undefined;
  }, [hasMany, hasMultipleRelations, value, options]);

  const handleInputChange = useCallback((newSearch) => {
    if (search !== newSearch) {
      setSearch(newSearch);
    }
  }, [search]);

  const addOptionByID = useCallback(async (id, relation) => {
    if (!errorLoading && id !== 'null') {
      const response = await fetch(`${serverURL}${api}/${relation}/${id}?depth=0`);

      if (response.ok) {
        const data = await response.json();
        addOptions({ docs: [data] }, relation);
      } else {
        console.error(`There was a problem loading the document with ID of ${id}.`);
      }
    }
  }, [addOptions, api, errorLoading, serverURL]);

  // ///////////////////////////
  // Get results when search input changes
  // ///////////////////////////

  useEffect(() => {
    dispatchOptions({
      type: 'CLEAR',
      required: true,
    });

    setHasLoadedFirstOptions(true);
    setLastLoadedPage(1);
    setLastFullyLoadedRelation(-1);
    getResults({ search: debouncedSearch });
  }, [getResults, debouncedSearch, relationTo]);

  // ///////////////////////////
  // Format options once first options have been retrieved
  // ///////////////////////////

  useEffect(() => {
    if (value && hasLoadedFirstOptions) {
      if (hasMany) {
        const matchedOptions = findOptionsByValue();

        (matchedOptions as Value[] || []).forEach((option, i) => {
          if (!option) {
            if (hasMultipleRelations) {
              addOptionByID(value[i].value, value[i].relationTo);
            } else {
              addOptionByID(value[i], relationTo);
            }
          }
        });
      } else {
        const matchedOption = findOptionsByValue();

        if (!matchedOption) {
          if (hasMultipleRelations) {
            const valueWithRelation = value as ValueWithRelation;
            addOptionByID(valueWithRelation.value, valueWithRelation.relationTo);
          } else {
            addOptionByID(value, relationTo);
          }
        }
      }
    }
  }, [addOptionByID, findOptionsByValue, hasMany, hasMultipleRelations, relationTo, value, hasLoadedFirstOptions]);

  const classes = [
    'field-type',
    baseClass,
    errorLoading && 'error-loading',
  ].filter(Boolean).join(' ');

  const valueToRender = (findOptionsByValue() || value) as Value;

  return (
    <div className={classes}>
      {!errorLoading && (
        <ReactSelect
          placeholder="Select a value"
          onInputChange={handleInputChange}
          onChange={(selected) => {
            if (hasMany) {
              onChange(selected ? selected.map((option) => {
                if (hasMultipleRelations) {
                  return {
                    relationTo: option.relationTo,
                    value: option.value,
                  };
                }

                return option.value;
              }) : null);
            } else if (hasMultipleRelations) {
              onChange({
                relationTo: selected.relationTo,
                value: selected.value,
              });
            } else {
              onChange(selected.value);
            }
          }}
          onMenuScrollToBottom={() => {
            getResults({ lastFullyLoadedRelation, lastLoadedPage: lastLoadedPage + 1 });
          }}
          value={valueToRender}
          options={options}
          isMulti={hasMany}
        />
      )}
      {errorLoading && (
        <div className={`${baseClass}__error-loading`}>
          {errorLoading}
        </div>
      )}
    </div>
  );
};

export default RelationshipField;
