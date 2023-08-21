import React, { useState, useReducer } from 'react';
import queryString from 'qs';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Props } from './types';
import useThrottledEffect from '../../../hooks/useThrottledEffect';
import Button from '../Button';
import reducer from './reducer';
import Condition from './Condition';
import fieldTypes from './field-types';
import flattenTopLevelFields from '../../../../utilities/flattenTopLevelFields';
import { useSearchParams } from '../../utilities/SearchParams';
import validateWhereQuery from './validateWhereQuery';
import { Where } from '../../../../types';
import { getTranslation } from '../../../../utilities/getTranslation';
import { transformWhereQuery } from './transformWhereQuery';

import './index.scss';

const baseClass = 'where-builder';

const reduceFields = (fields, i18n) => flattenTopLevelFields(fields).reduce((reduced, field) => {
  if (typeof fieldTypes[field.type] === 'object') {
    const formattedField = {
      label: getTranslation(field.label || field.name, i18n),
      value: field.name,
      ...fieldTypes[field.type],
      operators: fieldTypes[field.type].operators.map((operator) => ({
        ...operator,
        label: i18n.t(`operators:${operator.label}`),
      }
      )),
      props: {
        ...field,
      },
    };

    return [
      ...reduced,
      formattedField,
    ];
  }

  return reduced;
}, []);

/**
 * The WhereBuilder component is used to render the filter controls for a collection's list view.
 * It is part of the {@link ListControls} component which is used to render the controls (search, filter, where).
 */
const WhereBuilder: React.FC<Props> = (props) => {
  const {
    collection,
    modifySearchQuery = true,
    handleChange,
    collection: {
      labels: {
        plural,
      } = {},
    } = {},
  } = props;

  const history = useHistory();
  const params = useSearchParams();
  const { t, i18n } = useTranslation('general');

  // This handles initializing the where conditions from the search query (URL). That way, if you pass in
  // query params to the URL, the where conditions will be initialized from those and displayed in the UI.
  // Example: /admin/collections/posts?where[or][0][and][0][text][equals]=example%20post
  const [conditions, dispatchConditions] = useReducer(reducer, params.where, (whereFromSearch) => {
    if (modifySearchQuery && whereFromSearch) {
      if (validateWhereQuery(whereFromSearch)) {
        return whereFromSearch.or;
      }

      // Transform the where query to be in the right format. This will transform something simple like [text][equals]=example%20post to the right format
      const transformedWhere = transformWhereQuery(whereFromSearch);

      if (validateWhereQuery(transformedWhere)) {
        return transformedWhere.or;
      }

      console.warn('Invalid where query in URL. Ignoring.');
    }
    return [];
  });

  const [reducedFields] = useState(() => reduceFields(collection.fields, i18n));

  // This handles updating the search query (URL) when the where conditions change
  useThrottledEffect(() => {
    const currentParams = queryString.parse(history.location.search, { ignoreQueryPrefix: true, depth: 10 }) as { where: Where };

    const paramsToKeep = typeof currentParams?.where === 'object' && 'or' in currentParams.where ? currentParams.where.or.reduce((keptParams, param) => {
      const newParam = { ...param };
      if (param.and) {
        delete newParam.and;
      }
      return [
        ...keptParams,
        newParam,
      ];
    }, []) : [];

    const hasNewWhereConditions = conditions.length > 0;


    const newWhereQuery = {
      ...typeof currentParams?.where === 'object' && (validateWhereQuery(currentParams?.where) || !hasNewWhereConditions) ? currentParams.where : {},
      or: [
        ...conditions,
        ...paramsToKeep,
      ],
    };

    if (handleChange) handleChange(newWhereQuery as Where);

    const hasExistingConditions = typeof currentParams?.where === 'object' && 'or' in currentParams.where;

    if (modifySearchQuery && ((hasExistingConditions && !hasNewWhereConditions) || hasNewWhereConditions)) {
      history.replace({
        search: queryString.stringify({
          ...currentParams,
          page: 1,
          where: newWhereQuery,
        }, { addQueryPrefix: true }),
      });
    }
  }, 500, [conditions, modifySearchQuery, handleChange]);

  return (
    <div className={baseClass}>
      {conditions.length > 0 && (
        <React.Fragment>
          <div className={`${baseClass}__label`}>
            {t('filterWhere', { label: getTranslation(plural, i18n) }) }
          </div>
          <ul className={`${baseClass}__or-filters`}>
            {conditions.map((or, orIndex) => (
              <li key={orIndex}>
                {orIndex !== 0 && (
                  <div className={`${baseClass}__label`}>
                    {t('or')}
                  </div>
                )}
                <ul className={`${baseClass}__and-filters`}>
                  {Array.isArray(or?.and) && or.and.map((_, andIndex) => (
                    <li key={andIndex}>
                      {andIndex !== 0 && (
                        <div className={`${baseClass}__label`}>
                          {t('and')}
                        </div>
                      )}
                      <Condition
                        value={conditions[orIndex].and[andIndex]}
                        orIndex={orIndex}
                        andIndex={andIndex}
                        key={andIndex}
                        fields={reducedFields}
                        dispatch={dispatchConditions}
                      />
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          <Button
            className={`${baseClass}__add-or`}
            icon="plus"
            buttonStyle="icon-label"
            iconPosition="left"
            iconStyle="with-border"
            onClick={() => {
              if (reducedFields.length > 0) dispatchConditions({ type: 'add', field: reducedFields[0].value });
            }}
          >
            {t('or')}
          </Button>
        </React.Fragment>
      )}
      {conditions.length === 0 && (
        <div className={`${baseClass}__no-filters`}>
          <div className={`${baseClass}__label`}>{t('noFiltersSet')}</div>
          <Button
            className={`${baseClass}__add-first-filter`}
            icon="plus"
            buttonStyle="icon-label"
            iconPosition="left"
            iconStyle="with-border"
            onClick={() => {
              if (reducedFields.length > 0) dispatchConditions({ type: 'add', field: reducedFields[0].value });
            }}
          >
            {t('addFilter')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default WhereBuilder;
