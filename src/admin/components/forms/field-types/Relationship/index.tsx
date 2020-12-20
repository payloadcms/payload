import React, {
  useCallback, useEffect, useState, useReducer,
} from 'react';
import { useConfig } from '@payloadcms/config-provider';
import some from 'async-some';
import withCondition from '../../withCondition';
import ReactSelect from '../../../elements/ReactSelect';
import useFieldType from '../../useFieldType';
import Label from '../../Label';
import Error from '../../Error';
import { relationship } from '../../../../../fields/validations';
import { PaginatedDocs } from '../../../../../collections/config/types';
import { Props, OptionsPage, Option } from './types';
import { useFormProcessing } from '../../Form/context';
import optionsReducer from './optionsReducer';

import './index.scss';

const maxResultsPerRequest = 10;

const baseClass = 'relationship';

const RelationshipFieldType: React.FC<Props> = (props) => {
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
    required,
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

  const findValueInOptions = useCallback((opts, val): Option | Option[] => {
    let foundValue: Option | Option[];

    if (hasMultipleRelations) {
      opts.forEach((opt) => {
        const potentialValue = opt.options && opt.options.find((subOption) => {
          if (subOption?.value?.value && val?.value) {
            return subOption.value.value === val.value;
          }

          return false;
        });

        if (potentialValue) foundValue = potentialValue;
      });
    } else if (val) {
      if (hasMany && Array.isArray(val)) {
        foundValue = val.map((v) => opts.find((opt) => opt.value === v));
      } else {
        foundValue = opts.find((opt) => opt.value === val);
      }
    }

    return foundValue || undefined;
  }, [hasMany, hasMultipleRelations]);

  const handleInputChange = useCallback((newSearch) => {
    if (search !== newSearch) {
      setSearch(newSearch);
      setLastFullyLoadedRelation(-1);
      setLastLoadedPage(1);
    }
  }, [search]);

  const formatSelectedValue = useCallback((selectedValue) => {
    if (hasMany && Array.isArray(selectedValue)) {
      return selectedValue.map((val) => val.value);
    }

    return selectedValue ? selectedValue.value : selectedValue;
  }, [hasMany]);


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
    const locatedValue = findValueInOptions(options, value);

    if (hasMany && value?.length > 0) {
      value.forEach((val, i) => {
        if (!val && value[i]) {
          if (hasMultipleRelations) {
            addOptionByID(value[i].value, value[i].relationTo);
          } else {
            addOptionByID(value[i], relationTo);
          }
        }
      });
    } else if (!locatedValue && value) {
      if (hasMultipleRelations) {
        addOptionByID(value.value, value.relationTo);
      } else {
        addOptionByID(value, relationTo);
      }
    }
  }, [addOptionByID, findValueInOptions, hasMany, hasMultipleRelations, options, relationTo, value]);

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

  const valueToRender = findValueInOptions(options, value) || value;

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
          onChange={!readOnly ? setValue : undefined}
          formatValue={formatSelectedValue}
          onMenuScrollToBottom={getNextOptions}
          findValueInOptions={findValueInOptions}
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

export default withCondition(RelationshipFieldType);
