import React, {
  useCallback, useEffect, useState, useReducer,
} from 'react';
import { useConfig } from '@payloadcms/config-provider';
import some from 'async-some';
import withCondition from '../../withCondition';
import ReactSelect from '../../../elements/ReactSelect';
import { Value } from '../../../elements/ReactSelect/types';
import useFieldType from '../../useFieldType';
import Label from '../../Label';
import Error from '../../Error';
import { relationship } from '../../../../../fields/validations';
import { PaginatedDocs } from '../../../../../collections/config/types';
import { useFormProcessing } from '../../Form/context';
import optionsReducer from './optionsReducer';
import { Props, OptionsPage, Option, ValueWithRelation } from './types';

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
      width,
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
  const [relations] = useState(Array.isArray(relationTo) ? relationTo : [relationTo]);
  const [options, dispatchOptions] = useReducer(optionsReducer, required ? [] : [{ value: 'null', label: 'None' }]);
  const [lastFullyLoadedRelation, setLastFullyLoadedRelation] = useState(-1);
  const [lastLoadedPage, setLastLoadedPage] = useState(1);
  const [search, setSearch] = useState('');
  const [errorLoading, setErrorLoading] = useState(false);
  const [hasLoadedFirstOptions, setHasLoadedFirstOptions] = useState(false);

  const memoizedValidate = useCallback((value) => {
    const validationResult = validate(value, { required });
    return validationResult;
  }, [validate, required]);

  const {
    value,
    showError,
    errorMessage,
    setValue,
  } = useFieldType({
    path: path || name,
    validate: memoizedValidate,
  });

  const addOptions = useCallback((data, relation) => {
    const collection = collections.find((coll) => coll.slug === relation);
    dispatchOptions({ type: 'ADD', data, relation, hasMultipleRelations, collection });
  }, [collections, hasMultipleRelations]);


  const getNextOptions = useCallback((params = {} as Record<string, unknown>) => {
    const clear = params?.clear;

    if (clear) {
      dispatchOptions({
        type: 'REPLACE',
        payload: required ? [] : [{ value: 'null', label: 'None' }],
      });

      setLastFullyLoadedRelation(-1);
    }

    if (!errorLoading) {
      const relationsToSearch = lastFullyLoadedRelation === -1 ? relations : relations.slice(lastFullyLoadedRelation + 1);

      if (relationsToSearch.length > 0) {
        some(relationsToSearch, async (relation, callback) => {
          const collection = collections.find((coll) => coll.slug === relation);
          const fieldToSearch = collection?.admin?.useAsTitle || 'id';
          const searchParam = search ? `&where[${fieldToSearch}][like]=${search}` : '';
          const response = await fetch(`${serverURL}${api}/${relation}?limit=${maxResultsPerRequest}&page=${lastLoadedPage}${searchParam}`);
          const data: PaginatedDocs = await response.json();

          if (response.ok) {
            if (data.hasNextPage) {
              return callback(false, {
                data,
                relation,
              });
            }

            return callback({ relation, data });
          }

          return setErrorLoading(true);
        }, (lastPage: OptionsPage, nextPage: OptionsPage) => {
          if (nextPage) {
            const { data, relation } = nextPage;
            addOptions(data, relation);
            setLastLoadedPage(lastLoadedPage + 1);
          } else {
            const { data, relation } = lastPage;
            addOptions(data, relation);
            setLastFullyLoadedRelation(relations.indexOf(relation));
            setLastLoadedPage(1);
          }
        });
      }
    }
  }, [addOptions, api, collections, errorLoading, lastFullyLoadedRelation, lastLoadedPage, relations, required, search, serverURL]);

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
      setLastFullyLoadedRelation(-1);
      setLastLoadedPage(1);
    }
  }, [search]);

  const addOptionByID = useCallback(async (id, relation) => {
    if (!errorLoading) {
      const response = await fetch(`${serverURL}${api}/${relation}/${id}?depth=0`);

      if (response.ok) {
        const data = await response.json();
        addOptions({ docs: [data] }, relation);
      } else {
        console.error(`There was a problem loading the document with ID of ${id}.`);
      }
    }
  }, [addOptions, api, errorLoading, serverURL]);

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

  useEffect(() => {
    const getFirstResults = async () => {
      const relation = relations[0];
      const res = await fetch(`${serverURL}${api}/${relation}?limit=${maxResultsPerRequest}&depth=0`);

      if (res.ok) {
        const data: PaginatedDocs = await res.json();

        addOptions(data, relation);

        if (!data.hasNextPage) {
          setLastFullyLoadedRelation(relations.indexOf(relation));
        } else {
          setLastLoadedPage(2);
        }

        setHasLoadedFirstOptions(true);
      }
    };

    getFirstResults();
  }, [addOptions, api, relations, serverURL]);

  const classes = [
    'field-type',
    baseClass,
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
          onMenuScrollToBottom={getNextOptions}
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
    </div>
  );
};

export default withCondition(Relationship);
