import React, {
  useCallback, useEffect, useState, useReducer,
} from 'react';
import { useConfig } from '@payloadcms/config-provider';
import qs from 'qs';
import withCondition from '../../withCondition';
import ReactSelect from '../../../elements/ReactSelect';
import { Value } from '../../../elements/ReactSelect/types';
import useField from '../../useField';
import Label from '../../Label';
import Error from '../../Error';
import FieldDescription from '../../FieldDescription';
import { relationship } from '../../../../../fields/validations';
import { Where } from '../../../../../types';
import { PaginatedDocs } from '../../../../../mongoose/types';
import { useFormProcessing } from '../../Form/context';
import optionsReducer from './optionsReducer';
import { Props, Option, ValueWithRelation, GetResults } from './types';
import useDebounce from '../../../../hooks/useDebounce';
import { createRelationMap } from './createRelationMap';

import './index.scss';

const maxResultsPerRequest = 10;

const baseClass = 'relationship';

const Relationship: React.FC<Props> = (props) => {
  const {
    relationTo,
    validate = relationship,
    path,
    name,
    required,
    label,
    hasMany,
    admin: {
      readOnly,
      style,
      className,
      width,
      description,
      condition,
    } = {},
  } = props;

  const {
    serverURL,
    routes: {
      api,
    },
    collections,
  } = useConfig();

  const formProcessing = useFormProcessing();

  const hasMultipleRelations = Array.isArray(relationTo);
  const [options, dispatchOptions] = useReducer(optionsReducer, required ? [] : [{ value: 'null', label: 'None' }]);
  const [lastFullyLoadedRelation, setLastFullyLoadedRelation] = useState(-1);
  const [lastLoadedPage, setLastLoadedPage] = useState(1);
  const [search, setSearch] = useState('');
  const [errorLoading, setErrorLoading] = useState('');
  const [hasLoadedFirstOptions, setHasLoadedFirstOptions] = useState(false);
  const debouncedSearch = useDebounce<string>(search, 300);

  const memoizedValidate = useCallback((value) => {
    const validationResult = validate(value, { required });
    return validationResult;
  }, [validate, required]);

  const {
    value,
    showError,
    errorMessage,
    setValue,
    initialValue,
  } = useField({
    path: path || name,
    validate: memoizedValidate,
    condition,
  });

  const addOptions = useCallback((data, relation, sort) => {
    const collection = collections.find((coll) => coll.slug === relation);
    dispatchOptions({ type: 'ADD', data, relation, hasMultipleRelations, collection, sort });
  }, [collections, hasMultipleRelations]);


  const getResults: GetResults = useCallback(async ({
    lastFullyLoadedRelation: lastFullyLoadedRelationArg,
    lastLoadedPage: lastLoadedPageArg,
    search: searchArg,
    value: valueArg,
    sort,
  }) => {
    let lastLoadedPageToUse = typeof lastLoadedPageArg !== 'undefined' ? lastLoadedPageArg : 1;
    const lastFullyLoadedRelationToUse = typeof lastFullyLoadedRelationArg !== 'undefined' ? lastFullyLoadedRelationArg : -1;

    const relations = Array.isArray(relationTo) ? relationTo : [relationTo];
    const relationsToFetch = lastFullyLoadedRelationToUse === -1 ? relations : relations.slice(lastFullyLoadedRelationToUse + 1);

    let resultsFetched = 0;
    const relationMap = createRelationMap({ hasMany, relationTo, value: valueArg });

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

          if (searchArg) {
            query.where[fieldToSearch] = {
              like: searchArg,
            };
          } else {
            query.where.id = {
              not_in: relationMap[relation],
            };
          }

          const response = await fetch(`${serverURL}${api}/${relation}?${qs.stringify(query)}`);

          if (response.ok) {
            const data: PaginatedDocs<unknown> = await response.json();
            if (data.docs.length > 0) {
              resultsFetched += data.docs.length;
              addOptions(data, relation, sort);
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
  }, [addOptions, api, collections, serverURL, errorLoading, relationTo, hasMany]);

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

  // ///////////////////////////
  // Get results when search input changes
  // ///////////////////////////

  useEffect(() => {
    dispatchOptions({
      type: 'CLEAR',
      required,
    });

    setLastLoadedPage(1);
    setLastFullyLoadedRelation(-1);
    getResults({ search: debouncedSearch, value: initialValue, sort: true });
  }, [getResults, debouncedSearch, relationTo, required, initialValue]);

  // ///////////////////////////
  // Fetch value options when initialValue changes
  // ///////////////////////////

  useEffect(() => {
    if (initialValue && !hasLoadedFirstOptions) {
      const relationMap = createRelationMap({
        hasMany,
        relationTo,
        value: initialValue,
      });

      Object.entries(relationMap).reduce(async (priorRelation, [relation, ids]) => {
        await priorRelation;

        if (ids.length > 0) {
          const query = {
            where: {
              id: {
                in: ids,
              },
            },
            depth: 0,
            limit: ids.length,
          };

          if (!errorLoading) {
            const response = await fetch(`${serverURL}${api}/${relation}?${qs.stringify(query)}`);
            if (response.ok) {
              const data = await response.json();
              addOptions({ docs: data.docs }, relation, true);
            } else {
              console.error(`There was a problem loading relationships to related collection ${relation}.`);
            }
          }
        }
      }, Promise.resolve());

      setHasLoadedFirstOptions(true);
    }
  }, [hasMany, hasMultipleRelations, relationTo, initialValue, hasLoadedFirstOptions, errorLoading, addOptions, api, serverURL]);

  useEffect(() => {
    setHasLoadedFirstOptions(false);
  }, [initialValue]);

  const classes = [
    'field-type',
    baseClass,
    className,
    showError && 'error',
    errorLoading && 'error-loading',
    readOnly && `${baseClass}--read-only`,
  ].filter(Boolean).join(' ');

  const valueToRender = (findOptionsByValue() || value) as Value;

  return (
    <div
      className={classes}
      style={{
        ...style,
        width,
      }}
    >
      <Error
        showError={showError}
        message={errorMessage}
      />
      <Label
        htmlFor={path}
        label={label}
        required={required}
      />
      {!errorLoading && (
        <ReactSelect
          isDisabled={readOnly}
          onInputChange={handleInputChange}
          onChange={!readOnly ? (selected) => {
            if (hasMany) {
              setValue(selected ? selected.map((option) => {
                if (hasMultipleRelations) {
                  return {
                    relationTo: option.relationTo,
                    value: option.value,
                  };
                }

                return option.value;
              }) : null);
            } else if (hasMultipleRelations) {
              setValue({
                relationTo: selected.relationTo,
                value: selected.value,
              });
            } else {
              setValue(selected.value);
            }
          } : undefined}
          onMenuScrollToBottom={() => {
            getResults({
              lastFullyLoadedRelation,
              lastLoadedPage: lastLoadedPage + 1,
              search,
              value: initialValue,
              sort: false,
            });
          }}
          value={valueToRender}
          showError={showError}
          disabled={formProcessing}
          options={options}
          isMulti={hasMany}
        />
      )}
      {errorLoading && (
        <div className={`${baseClass}__error-loading`}>
          {errorLoading}
        </div>
      )}
      <FieldDescription
        value={value}
        description={description}
      />
    </div>
  );
};

export default withCondition(Relationship);
