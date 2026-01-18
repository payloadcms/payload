'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
// TODO: abstract the `next/navigation` dependency out from this component
import { usePathname, useRouter, useSearchParams } from 'next/navigation.js';
import { sortableFieldTypes } from 'payload';
import { fieldAffectsData } from 'payload/shared';
import * as qs from 'qs-esm';
import React, { useEffect, useState } from 'react';
import { useTranslation } from '../../providers/Translation/index.js';
import { ReactSelect } from '../ReactSelect/index.js';
import './index.scss';
const baseClass = 'sort-complex';
export const SortComplex = props => {
  const $ = _c(28);
  const {
    collection,
    handleChange,
    modifySearchQuery: t0
  } = props;
  const modifySearchQuery = t0 === undefined ? true : t0;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {
    i18n,
    t
  } = useTranslation();
  const [sortOptions, setSortOptions] = useState();
  let t1;
  if ($[0] !== collection.fields || $[1] !== i18n) {
    t1 = () => collection.fields.reduce((fields, field) => {
      if (fieldAffectsData(field) && sortableFieldTypes.indexOf(field.type) > -1) {
        return [...fields, {
          label: getTranslation(field.label || field.name, i18n),
          value: field.name
        }];
      }
      return fields;
    }, []);
    $[0] = collection.fields;
    $[1] = i18n;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  const [sortFields] = useState(t1);
  const [sortField, setSortField] = useState(sortFields[0]);
  let t2;
  if ($[3] !== t) {
    t2 = () => ({
      label: t("general:descending"),
      value: "-"
    });
    $[3] = t;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  const [initialSort] = useState(t2);
  const [sortOrder, setSortOrder] = useState(initialSort);
  let t3;
  let t4;
  if ($[5] !== handleChange || $[6] !== modifySearchQuery || $[7] !== pathname || $[8] !== router || $[9] !== searchParams || $[10] !== sortField || $[11] !== sortOrder) {
    t3 = () => {
      if (sortField?.value) {
        const newSortValue = `${sortOrder.value}${sortField.value}`;
        if (handleChange) {
          handleChange(newSortValue);
        }
        if (searchParams.get("sort") !== newSortValue && modifySearchQuery) {
          const search = qs.stringify({
            ...searchParams,
            sort: newSortValue
          }, {
            addQueryPrefix: true
          });
          router.replace(`${pathname}${search}`);
        }
      }
    };
    t4 = [pathname, router, searchParams, sortField, sortOrder, modifySearchQuery, handleChange];
    $[5] = handleChange;
    $[6] = modifySearchQuery;
    $[7] = pathname;
    $[8] = router;
    $[9] = searchParams;
    $[10] = sortField;
    $[11] = sortOrder;
    $[12] = t3;
    $[13] = t4;
  } else {
    t3 = $[12];
    t4 = $[13];
  }
  useEffect(t3, t4);
  let t5;
  if ($[14] !== t) {
    t5 = () => {
      setSortOptions([{
        label: t("general:ascending"),
        value: ""
      }, {
        label: t("general:descending"),
        value: "-"
      }]);
    };
    $[14] = t;
    $[15] = t5;
  } else {
    t5 = $[15];
  }
  let t6;
  if ($[16] !== i18n || $[17] !== t) {
    t6 = [i18n, t];
    $[16] = i18n;
    $[17] = t;
    $[18] = t6;
  } else {
    t6 = $[18];
  }
  useEffect(t5, t6);
  let t7;
  if ($[19] !== initialSort || $[20] !== sortField || $[21] !== sortFields || $[22] !== sortOptions || $[23] !== sortOrder || $[24] !== t) {
    let t8;
    if ($[26] !== initialSort) {
      t8 = incomingSort => {
        setSortOrder(incomingSort || initialSort);
      };
      $[26] = initialSort;
      $[27] = t8;
    } else {
      t8 = $[27];
    }
    t7 = _jsx("div", {
      className: baseClass,
      children: _jsx(React.Fragment, {
        children: _jsxs("div", {
          className: `${baseClass}__wrap`,
          children: [_jsxs("div", {
            className: `${baseClass}__select`,
            children: [_jsx("div", {
              className: `${baseClass}__label`,
              children: t("general:columnToSort")
            }), _jsx(ReactSelect, {
              onChange: setSortField,
              options: sortFields,
              value: sortField
            })]
          }), _jsxs("div", {
            className: `${baseClass}__select`,
            children: [_jsx("div", {
              className: `${baseClass}__label`,
              children: t("general:order")
            }), _jsx(ReactSelect, {
              onChange: t8,
              options: sortOptions,
              value: sortOrder
            })]
          })]
        })
      })
    });
    $[19] = initialSort;
    $[20] = sortField;
    $[21] = sortFields;
    $[22] = sortOptions;
    $[23] = sortOrder;
    $[24] = t;
    $[25] = t7;
  } else {
    t7 = $[25];
  }
  return t7;
};
//# sourceMappingURL=index.js.map