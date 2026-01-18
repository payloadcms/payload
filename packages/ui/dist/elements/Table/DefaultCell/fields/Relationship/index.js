'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import React, { useEffect, useMemo, useState } from 'react';
import { useIntersect } from '../../../../../hooks/useIntersect.js';
import { useConfig } from '../../../../../providers/Config/index.js';
import { useTranslation } from '../../../../../providers/Translation/index.js';
import { canUseDOM } from '../../../../../utilities/canUseDOM.js';
import { formatDocTitle } from '../../../../../utilities/formatDocTitle/index.js';
import { useListRelationships } from '../../../RelationshipProvider/index.js';
import { FileCell } from '../File/index.js';
import './index.scss';
const baseClass = 'relationship-cell';
const totalToShow = 3;
export const RelationshipCell = t0 => {
  const $ = _c(39);
  const {
    cellData: cellDataFromProps,
    customCellProps: customCellContext,
    field,
    field: t1
  } = t0;
  const {
    label
  } = t1;
  const relationTo = "relationTo" in field && field.relationTo || "collection" in field && field.collection;
  const cellData = "collection" in field ? cellDataFromProps?.docs : cellDataFromProps;
  const {
    config,
    getEntityConfig
  } = useConfig();
  const {
    collections
  } = config;
  const [intersectionRef, entry] = useIntersect();
  let t2;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = [];
    $[0] = t2;
  } else {
    t2 = $[0];
  }
  const [values, setValues] = useState(t2);
  const {
    documents,
    getRelationships
  } = useListRelationships();
  const [hasRequested, setHasRequested] = useState(false);
  const {
    i18n,
    t
  } = useTranslation();
  const isAboveViewport = canUseDOM ? entry?.boundingClientRect?.top < window.innerHeight : false;
  let t3;
  if ($[1] !== cellData || $[2] !== getRelationships || $[3] !== hasRequested || $[4] !== isAboveViewport || $[5] !== relationTo) {
    t3 = () => {
      if ((cellData || typeof cellData === "number") && isAboveViewport && !hasRequested) {
        const formattedValues = [];
        const arrayCellData = Array.isArray(cellData) ? cellData : [cellData];
        arrayCellData.slice(0, arrayCellData.length < totalToShow ? arrayCellData.length : totalToShow).forEach(cell => {
          if (typeof cell === "object" && "relationTo" in cell && "value" in cell) {
            formattedValues.push(cell);
          }
          if ((typeof cell === "number" || typeof cell === "string") && typeof relationTo === "string") {
            formattedValues.push({
              relationTo,
              value: cell
            });
          }
        });
        getRelationships(formattedValues);
        setHasRequested(true);
        setValues(formattedValues);
      }
    };
    $[1] = cellData;
    $[2] = getRelationships;
    $[3] = hasRequested;
    $[4] = isAboveViewport;
    $[5] = relationTo;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  let t4;
  if ($[7] !== cellData || $[8] !== collections || $[9] !== getRelationships || $[10] !== hasRequested || $[11] !== isAboveViewport || $[12] !== relationTo) {
    t4 = [cellData, relationTo, collections, isAboveViewport, hasRequested, getRelationships];
    $[7] = cellData;
    $[8] = collections;
    $[9] = getRelationships;
    $[10] = hasRequested;
    $[11] = isAboveViewport;
    $[12] = relationTo;
    $[13] = t4;
  } else {
    t4 = $[13];
  }
  useEffect(t3, t4);
  let t5;
  if ($[14] !== hasRequested) {
    t5 = () => {
      if (hasRequested) {
        setHasRequested(false);
      }
    };
    $[14] = hasRequested;
    $[15] = t5;
  } else {
    t5 = $[15];
  }
  let t6;
  if ($[16] !== cellData) {
    t6 = [cellData];
    $[16] = cellData;
    $[17] = t6;
  } else {
    t6 = $[17];
  }
  useEffect(t5, t6);
  let t7;
  if ($[18] !== cellData || $[19] !== config.admin || $[20] !== customCellContext || $[21] !== documents || $[22] !== field || $[23] !== getEntityConfig || $[24] !== i18n || $[25] !== intersectionRef || $[26] !== label || $[27] !== t || $[28] !== values) {
    let t8;
    if ($[30] !== config.admin || $[31] !== customCellContext || $[32] !== documents || $[33] !== field || $[34] !== getEntityConfig || $[35] !== i18n || $[36] !== t || $[37] !== values.length) {
      t8 = (t9, i) => {
        const {
          relationTo: relationTo_0,
          value
        } = t9;
        const document = documents[relationTo_0][value];
        const relatedCollection = getEntityConfig({
          collectionSlug: relationTo_0
        });
        const label_0 = formatDocTitle({
          collectionConfig: relatedCollection,
          data: document || null,
          dateFormat: config.admin.dateFormat,
          fallback: `${t("general:untitled")} - ID: ${value}`,
          i18n
        });
        let fileField = null;
        if (field.type === "upload") {
          const fieldPreviewAllowed = "displayPreview" in field ? field.displayPreview : undefined;
          const previewAllowed = fieldPreviewAllowed ?? relatedCollection.upload?.displayPreview ?? true;
          if (previewAllowed && document) {
            fileField = _jsx(FileCell, {
              cellData: label_0,
              collectionConfig: relatedCollection,
              collectionSlug: relatedCollection.slug,
              customCellProps: customCellContext,
              field,
              rowData: document
            });
          }
        }
        return _jsxs(React.Fragment, {
          children: [document === false && `${t("general:untitled")} - ID: ${value}`, document === null && `${t("general:loading")}...`, document ? fileField || label_0 : null, values.length > i + 1 && ", "]
        }, i);
      };
      $[30] = config.admin;
      $[31] = customCellContext;
      $[32] = documents;
      $[33] = field;
      $[34] = getEntityConfig;
      $[35] = i18n;
      $[36] = t;
      $[37] = values.length;
      $[38] = t8;
    } else {
      t8 = $[38];
    }
    t7 = _jsxs("div", {
      className: baseClass,
      ref: intersectionRef,
      children: [values.map(t8), Array.isArray(cellData) && cellData.length > totalToShow && t("fields:itemsAndMore", {
        count: cellData.length - totalToShow,
        items: ""
      }), values.length === 0 && t("general:noLabel", {
        label: getTranslation(label || "", i18n)
      })]
    });
    $[18] = cellData;
    $[19] = config.admin;
    $[20] = customCellContext;
    $[21] = documents;
    $[22] = field;
    $[23] = getEntityConfig;
    $[24] = i18n;
    $[25] = intersectionRef;
    $[26] = label;
    $[27] = t;
    $[28] = values;
    $[29] = t7;
  } else {
    t7 = $[29];
  }
  return t7;
};
//# sourceMappingURL=index.js.map