'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import { transformWhereQuery, validateWhereQuery } from 'payload/shared';
import React, { useMemo } from 'react';
import { useAuth } from '../../providers/Auth/index.js';
import { useListQuery } from '../../providers/ListQuery/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { reduceFieldsToOptions } from '../../utilities/reduceFieldsToOptions.js';
import { Button } from '../Button/index.js';
import { Condition } from './Condition/index.js';
import { fieldTypeConditions, getValidFieldOperators } from './field-types.js';
import './index.scss';
const baseClass = 'where-builder';
/**
 * The WhereBuilder component is used to render the filter controls for a collection's list view.
 * It is part of the {@link ListControls} component which is used to render the controls (search, filter, where).
 */
export const WhereBuilder = props => {
  const {
    collectionPluralLabel,
    collectionSlug,
    fields,
    renderedFilters,
    resolvedFilterOptions
  } = props;
  const {
    i18n,
    t
  } = useTranslation();
  const {
    permissions
  } = useAuth();
  const fieldPermissions = permissions?.collections?.[collectionSlug]?.fields;
  const reducedFields = useMemo(() => reduceFieldsToOptions({
    fieldPermissions,
    fields,
    i18n
  }), [fieldPermissions, fields, i18n]);
  const {
    handleWhereChange,
    query
  } = useListQuery();
  const conditions = useMemo(() => {
    const whereFromSearch = query.where;
    if (whereFromSearch) {
      if (validateWhereQuery(whereFromSearch)) {
        return whereFromSearch.or;
      }
      // Transform the where query to be in the right format. This will transform something simple like [text][equals]=example%20post to the right format
      const transformedWhere = transformWhereQuery(whereFromSearch);
      if (validateWhereQuery(transformedWhere)) {
        return transformedWhere.or;
      }
      console.warn(`Invalid where query in URL: ${JSON.stringify(whereFromSearch)}`); // eslint-disable-line no-console
    }
    return [];
  }, [query.where]);
  const addCondition = React.useCallback(async ({
    andIndex,
    field,
    orIndex,
    relation
  }) => {
    const newConditions = [...conditions];
    const defaultOperator = fieldTypeConditions[field.field.type].operators[0].value;
    if (relation === 'and') {
      newConditions[orIndex].and.splice(andIndex, 0, {
        [String(field.value)]: {
          [defaultOperator]: undefined
        }
      });
    } else {
      newConditions.push({
        and: [{
          [String(field.value)]: {
            [defaultOperator]: undefined
          }
        }]
      });
    }
    await handleWhereChange({
      or: newConditions
    });
  }, [conditions, handleWhereChange]);
  const updateCondition = React.useCallback(async ({
    andIndex: andIndex_0,
    field: field_0,
    operator: incomingOperator,
    orIndex: orIndex_0,
    value
  }) => {
    const existingCondition = conditions[orIndex_0].and[andIndex_0];
    if (typeof existingCondition === 'object' && field_0.value) {
      const {
        validOperator
      } = getValidFieldOperators({
        field: field_0.field,
        operator: incomingOperator
      });
      const newRowCondition = {
        [String(field_0.value)]: {
          [validOperator]: value
        }
      };
      const newConditions_0 = [...conditions];
      newConditions_0[orIndex_0].and[andIndex_0] = newRowCondition;
      await handleWhereChange({
        or: newConditions_0
      });
    }
  }, [conditions, handleWhereChange]);
  const removeCondition = React.useCallback(async ({
    andIndex: andIndex_1,
    orIndex: orIndex_1
  }) => {
    const newConditions_1 = [...conditions];
    newConditions_1[orIndex_1].and.splice(andIndex_1, 1);
    if (newConditions_1[orIndex_1].and.length === 0) {
      newConditions_1.splice(orIndex_1, 1);
    }
    await handleWhereChange({
      or: newConditions_1
    });
  }, [conditions, handleWhereChange]);
  return /*#__PURE__*/_jsxs("div", {
    className: baseClass,
    children: [conditions.length > 0 && /*#__PURE__*/_jsxs(React.Fragment, {
      children: [/*#__PURE__*/_jsx("p", {
        className: `${baseClass}__label`,
        children: t('general:filterWhere', {
          label: getTranslation(collectionPluralLabel, i18n)
        })
      }), /*#__PURE__*/_jsx("ul", {
        className: `${baseClass}__or-filters`,
        children: conditions.map((or, orIndex_2) => {
          const compoundOrKey = `${orIndex_2}_${Array.isArray(or?.and) ? or.and.length : ''}`;
          return /*#__PURE__*/_jsxs("li", {
            children: [orIndex_2 !== 0 && /*#__PURE__*/_jsx("div", {
              className: `${baseClass}__label`,
              children: t('general:or')
            }), /*#__PURE__*/_jsx("ul", {
              className: `${baseClass}__and-filters`,
              children: Array.isArray(or?.and) && or.and.map((_, andIndex_2) => {
                const condition = conditions[orIndex_2].and[andIndex_2];
                const fieldPath = Object.keys(condition)[0];
                const operator = Object.keys(condition?.[fieldPath] || {})?.[0] || undefined;
                const value_0 = condition?.[fieldPath]?.[operator] || undefined;
                return /*#__PURE__*/_jsxs("li", {
                  children: [andIndex_2 !== 0 && /*#__PURE__*/_jsx("div", {
                    className: `${baseClass}__label`,
                    children: t('general:and')
                  }), /*#__PURE__*/_jsx(Condition, {
                    addCondition: addCondition,
                    andIndex: andIndex_2,
                    fieldPath: fieldPath,
                    filterOptions: resolvedFilterOptions?.get(fieldPath),
                    operator: operator,
                    orIndex: orIndex_2,
                    reducedFields: reducedFields,
                    removeCondition: removeCondition,
                    RenderedFilter: renderedFilters?.get(fieldPath),
                    updateCondition: updateCondition,
                    value: value_0
                  })]
                }, andIndex_2);
              })
            })]
          }, compoundOrKey);
        })
      }), /*#__PURE__*/_jsx(Button, {
        buttonStyle: "icon-label",
        className: `${baseClass}__add-or`,
        icon: "plus",
        iconPosition: "left",
        iconStyle: "with-border",
        onClick: async () => {
          await addCondition({
            andIndex: 0,
            field: reducedFields.find(field_1 => !field_1.field.admin?.disableListFilter),
            orIndex: conditions.length,
            relation: 'or'
          });
        },
        children: t('general:or')
      })]
    }), conditions.length === 0 && /*#__PURE__*/_jsxs("div", {
      className: `${baseClass}__no-filters`,
      children: [/*#__PURE__*/_jsx("div", {
        className: `${baseClass}__label`,
        children: t('general:noFiltersSet')
      }), /*#__PURE__*/_jsx(Button, {
        buttonStyle: "icon-label",
        className: `${baseClass}__add-first-filter`,
        icon: "plus",
        iconPosition: "left",
        iconStyle: "with-border",
        onClick: async () => {
          if (reducedFields.length > 0) {
            await addCondition({
              andIndex: 0,
              field: reducedFields.find(field_2 => !field_2.field.admin?.disableListFilter),
              orIndex: conditions.length,
              relation: 'or'
            });
          }
        },
        children: t('general:addFilter')
      })]
    })]
  });
};
//# sourceMappingURL=index.js.map