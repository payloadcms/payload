import React, {
  useCallback, useEffect, useState, useReducer, useRef,
} from 'react';
import equal from 'deep-equal';
import qs from 'qs';
import { useTranslation } from 'react-i18next';
import { useConfig } from '../../../utilities/Config';
import { useAuth } from '../../../utilities/Auth';
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
import { useFormProcessing, useAllFormFields } from '../../Form/context';
import optionsReducer from './optionsReducer';
import { Props, Option, ValueWithRelation, GetResults } from './types';
import { createRelationMap } from './createRelationMap';
import { useDebouncedCallback } from '../../../../hooks/useDebouncedCallback';
import { useDocumentInfo } from '../../../utilities/DocumentInfo';
import { getFilterOptionsQuery } from '../getFilterOptionsQuery';
import wordBoundariesRegex from '../../../../../utilities/wordBoundariesRegex';
import reduceFieldsToValues from '../../Form/reduceFieldsToValues';
import getSiblingData from '../../Form/getSiblingData';
import { AddNewRelation } from './AddNew';

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
    filterOptions,
    admin: {
      readOnly,
      style,
      className,
      width,
      description,
      condition,
      isSortable = true,
    } = {},
  } = props;

  const {
    serverURL,
    routes: {
      api,
    },
    collections,
  } = useConfig();

  const { t, i18n } = useTranslation('fields');
  const { id } = useDocumentInfo();
  const { user, permissions } = useAuth();
  const [fields] = useAllFormFields();
  const formProcessing = useFormProcessing();
  const hasMultipleRelations = Array.isArray(relationTo);
  const [options, dispatchOptions] = useReducer(optionsReducer, required || hasMany ? [] : [{ value: null, label: t('general:none') }]);
  const [lastFullyLoadedRelation, setLastFullyLoadedRelation] = useState(-1);
  const [lastLoadedPage, setLastLoadedPage] = useState(1);
  const [errorLoading, setErrorLoading] = useState('');
  const [optionFilters, setOptionFilters] = useState<{ [relation: string]: Where }>();
  const [hasLoadedInitialValues, setHasLoadedInitialValues] = useState(false);
  const [search, setSearch] = useState('');
  const [enableWordBoundarySearch, setEnableWordBoundarySearch] = useState(false);
  const firstRun = useRef(true);
  const fieldsRef = useRef(fields);

  const memoizedValidate = useCallback((value, validationOptions) => {
    return validate(value, { ...validationOptions, required });
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

  const getFormData = useCallback(() => {
    return [
      reduceFieldsToValues(fieldsRef.current, true),
      getSiblingData(fieldsRef.current, path),
    ];
  }, [fieldsRef, path]);

  const getResults: GetResults = useCallback(async ({
    lastFullyLoadedRelation: lastFullyLoadedRelationArg,
    lastLoadedPage: lastLoadedPageArg,
    search: searchArg,
    value: valueArg,
    sort,
  }) => {
    if (!permissions) {
      return;
    }
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
            where: {
              and: [
                {
                  id: {
                    not_in: relationMap[relation],
                  },
                },
              ],
            },
            limit: maxResultsPerRequest,
            page: lastLoadedPageToUse,
            sort: fieldToSearch,
            depth: 0,
          };

          if (searchArg) {
            query.where.and.push({
              [fieldToSearch]: {
                like: searchArg,
              },
            });
          }

          if (optionFilters?.[relation]) {
            query.where.and.push(optionFilters[relation]);
          }

          const response = await fetch(`${serverURL}${api}/${relation}?${qs.stringify(query)}`, {
            credentials: 'include',
            headers: {
              'Accept-Language': i18n.language,
            },
          });

          if (response.ok) {
            const data: PaginatedDocs<unknown> = await response.json();
            if (data.docs.length > 0) {
              resultsFetched += data.docs.length;
              dispatchOptions({ type: 'ADD', docs: data.docs, hasMultipleRelations, collection, sort, i18n });
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
          } else if (response.status === 403) {
            setLastFullyLoadedRelation(relations.indexOf(relation));
            lastLoadedPageToUse = 1;
            dispatchOptions({ type: 'ADD', docs: [], hasMultipleRelations, collection, sort, ids: relationMap[relation], i18n });
          } else {
            setErrorLoading(t('error:unspecific'));
          }
        }
      }, Promise.resolve());
    }
  }, [
    permissions,
    relationTo,
    hasMany,
    errorLoading,
    collections,
    optionFilters,
    serverURL,
    api,
    hasMultipleRelations,
    t,
    i18n,
  ]);

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

  const updateSearch = useDebouncedCallback((searchArg: string, valueArg: unknown) => {
    getResults({ search: searchArg, value: valueArg, sort: true });
    setSearch(searchArg);
  }, [getResults]);

  const handleInputChange = useCallback((searchArg: string, valueArg: unknown) => {
    if (search !== searchArg) {
      updateSearch(searchArg, valueArg);
    }
  }, [search, updateSearch]);

  const ensureValuesAreLoaded = useCallback((valueToResolve) => {
    const relationMap = createRelationMap({
      hasMany,
      relationTo,
      value: valueToResolve,
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
          const response = await fetch(`${serverURL}${api}/${relation}?${qs.stringify(query)}`, {
            credentials: 'include',
            headers: {
              'Accept-Language': i18n.language,
            },
          });
          const collection = collections.find((coll) => coll.slug === relation);
          if (response.ok) {
            const data = await response.json();
            dispatchOptions({ type: 'ADD', docs: data.docs, hasMultipleRelations, collection, sort: true, ids, i18n });
          } else if (response.status === 403) {
            dispatchOptions({ type: 'ADD', docs: [], hasMultipleRelations, collection, sort: true, ids, i18n });
          }
        }
      }
    }, Promise.resolve());
  }, [
    api,
    collections,
    errorLoading,
    hasMany,
    hasMultipleRelations,
    i18n,
    relationTo,
    serverURL,
  ]);

  // ///////////////////////////
  // Fetch value options when initialValue changes
  // ///////////////////////////

  useEffect(() => {
    if (value) {
      // hasMany: true
      if (Array.isArray(value)) {
        const unresolvedRelationIds = value.reduce<string[]>((unresolvedIds, option) => {
          if (typeof option === 'object' && 'value' in option) {
            // relationTo many collections
            if (!options.find((opt) => opt.value === option.value)) {
              unresolvedIds.push(option.value);
            }
          } else if (typeof option === 'string') {
            // relationTo one collection
            if (!options.find((opt) => opt.value === option)) {
              unresolvedIds.push(option);
            }
          }

          return unresolvedIds;
        }, []);

        if (unresolvedRelationIds.length > 0) {
          ensureValuesAreLoaded(unresolvedRelationIds);
        }
      } else if (!options.find((opt) => opt.value === value)) {
        // hasMany: false
        ensureValuesAreLoaded(value);
      }
    } else if (initialValue && !hasLoadedInitialValues) {
      ensureValuesAreLoaded(initialValue);
      setHasLoadedInitialValues(true);
    }
  }, [ensureValuesAreLoaded, hasLoadedInitialValues, initialValue, options, value]);

  useEffect(() => {
    if (!filterOptions) return;

    const [data, siblingData] = getFormData();

    const newOptionFilters = getFilterOptionsQuery(filterOptions, {
      id,
      data,
      relationTo,
      siblingData,
      user,
    });
    if (!equal(newOptionFilters, optionFilters)) {
      setOptionFilters(newOptionFilters);
    }
  }, [relationTo, filterOptions, optionFilters, id, getFormData, path, user]);

  useEffect(() => {
    if (optionFilters || !filterOptions) {
      setHasLoadedInitialValues(false);
      getResults({
        value: initialValue,
      });
    }
  }, [initialValue, getResults, optionFilters, filterOptions]);

  // Determine if we should switch to word boundary search
  useEffect(() => {
    const relations = Array.isArray(relationTo) ? relationTo : [relationTo];
    const isIdOnly = relations.reduce((idOnly, relation) => {
      const collection = collections.find((coll) => coll.slug === relation);
      const fieldToSearch = collection?.admin?.useAsTitle || 'id';
      return fieldToSearch === 'id' && idOnly;
    }, true);
    setEnableWordBoundarySearch(!isIdOnly);
  }, [relationTo, collections]);


  // When relationTo changes, reset relationship options
  // Note - effect should not run on first run
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }

    dispatchOptions({ type: 'CLEAR' });
    setHasLoadedInitialValues(false);
  }, [relationTo]);

  const classes = [
    'field-type',
    baseClass,
    className,
    showError && 'error',
    errorLoading && 'error-loading',
    readOnly && `${baseClass}--read-only`,
  ].filter(Boolean).join(' ');

  const valueToRender = (findOptionsByValue() || value) as Value;
  if (valueToRender?.value === 'null') valueToRender.value = null;

  return (
    <div
      id={`field-${(path || name).replace(/\./gi, '__')}`}
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
        <div className={`${baseClass}__wrap`}>
          <ReactSelect
            isDisabled={readOnly}
            onInputChange={(newSearch) => handleInputChange(newSearch, value)}
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
            isSortable={isSortable}
            filterOption={enableWordBoundarySearch ? (item, searchFilter) => {
              const r = wordBoundariesRegex(searchFilter || '');
              return r.test(item.label);
            } : undefined}
          />
          {!readOnly && (
            <AddNewRelation
              {...{ path, hasMany, relationTo, value, setValue, dispatchOptions }}
            />
          )}
        </div>
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
