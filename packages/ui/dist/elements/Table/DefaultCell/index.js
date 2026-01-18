'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import { fieldAffectsData, fieldIsID } from 'payload/shared';
import React from 'react'; // TODO: abstract this out to support all routers
import { useConfig } from '../../../providers/Config/index.js';
import { useTranslation } from '../../../providers/Translation/index.js';
import { formatAdminURL } from '../../../utilities/formatAdminURL.js';
import { getDisplayedFieldValue } from '../../../utilities/getDisplayedFieldValue.js';
import { isValidReactElement } from '../../../utilities/isValidReactElement.js';
import { Link } from '../../Link/index.js';
import { CodeCell } from './fields/Code/index.js';
import { cellComponents } from './fields/index.js';
export const DefaultCell = props => {
  const $ = _c(16);
  const {
    cellData,
    className: classNameFromProps,
    collectionSlug,
    field,
    field: t0,
    link,
    linkURL,
    onClick: onClickFromProps,
    rowData,
    viewType
  } = props;
  const {
    admin
  } = t0;
  const {
    i18n
  } = useTranslation();
  const {
    config: t1,
    getEntityConfig
  } = useConfig();
  const {
    routes: t2
  } = t1;
  const {
    admin: adminRoute
  } = t2;
  let t3;
  let t4;
  if ($[0] !== admin || $[1] !== adminRoute || $[2] !== cellData || $[3] !== classNameFromProps || $[4] !== collectionSlug || $[5] !== field || $[6] !== getEntityConfig || $[7] !== i18n || $[8] !== link || $[9] !== linkURL || $[10] !== onClickFromProps || $[11] !== props || $[12] !== rowData || $[13] !== viewType) {
    t4 = Symbol.for("react.early_return_sentinel");
    bb0: {
      const collectionConfig = getEntityConfig({
        collectionSlug
      });
      const classNameFromConfigContext = admin && "className" in admin ? admin.className : undefined;
      const className = classNameFromProps || (field.admin && "className" in field.admin ? field.admin.className : null) || classNameFromConfigContext;
      const onClick = onClickFromProps;
      let WrapElement = "span";
      const wrapElementProps = {
        className
      };
      if (link) {
        wrapElementProps.prefetch = false;
        WrapElement = Link;
        if (linkURL) {
          wrapElementProps.href = linkURL;
        } else {
          wrapElementProps.href = collectionConfig?.slug ? formatAdminURL({
            adminRoute,
            path: `/collections/${collectionConfig?.slug}${viewType === "trash" ? "/trash" : ""}/${encodeURIComponent(rowData.id)}`
          }) : "";
        }
      }
      if (typeof onClick === "function") {
        WrapElement = "button";
        wrapElementProps.type = "button";
        wrapElementProps.onClick = () => {
          onClick({
            cellData,
            collectionSlug: collectionConfig?.slug,
            rowData
          });
        };
      }
      if (fieldIsID(field)) {
        t4 = _jsx(WrapElement, {
          ...wrapElementProps,
          children: _jsx(CodeCell, {
            cellData: `ID: ${cellData}`,
            collectionConfig,
            collectionSlug,
            field: {
              ...field,
              type: "code"
            },
            nowrap: true,
            rowData
          })
        });
        break bb0;
      }
      const displayedValue = getDisplayedFieldValue(cellData, field, i18n);
      const DefaultCellComponent = typeof cellData !== "undefined" && cellComponents[field.type];
      let CellComponent = null;
      if (isValidReactElement(displayedValue)) {
        CellComponent = displayedValue;
      } else {
        if (DefaultCellComponent) {
          CellComponent = _jsx(DefaultCellComponent, {
            cellData,
            rowData,
            ...props
          });
        } else {
          if (!DefaultCellComponent) {
            if (collectionConfig?.upload && fieldAffectsData(field) && field.name === "filename" && field.type === "text") {
              const FileCellComponent = cellComponents.File;
              CellComponent = _jsx(FileCellComponent, {
                cellData,
                rowData,
                ...props,
                collectionConfig,
                field
              });
            } else {
              t4 = _jsxs(WrapElement, {
                ...wrapElementProps,
                children: [(displayedValue === "" || typeof displayedValue === "undefined" || displayedValue === null) && i18n.t("general:noLabel", {
                  label: getTranslation(("label" in field ? field.label : null) || "data", i18n)
                }), typeof displayedValue === "string" && displayedValue, typeof displayedValue === "number" && displayedValue, typeof displayedValue === "object" && displayedValue !== null && JSON.stringify(displayedValue)]
              });
              break bb0;
            }
          }
        }
      }
      if ((field.type === "select" || field.type === "radio") && field.options.length && cellData) {
        const classes = Array.isArray(cellData) ? cellData.map(_temp).join(" ") : `selected--${cellData}`;
        const className_0 = [wrapElementProps.className, classes].filter(Boolean).join(" ");
        t4 = _jsx(WrapElement, {
          ...wrapElementProps,
          className: className_0,
          children: CellComponent
        });
        break bb0;
      }
      t3 = _jsx(WrapElement, {
        ...wrapElementProps,
        children: CellComponent
      });
    }
    $[0] = admin;
    $[1] = adminRoute;
    $[2] = cellData;
    $[3] = classNameFromProps;
    $[4] = collectionSlug;
    $[5] = field;
    $[6] = getEntityConfig;
    $[7] = i18n;
    $[8] = link;
    $[9] = linkURL;
    $[10] = onClickFromProps;
    $[11] = props;
    $[12] = rowData;
    $[13] = viewType;
    $[14] = t3;
    $[15] = t4;
  } else {
    t3 = $[14];
    t4 = $[15];
  }
  if (t4 !== Symbol.for("react.early_return_sentinel")) {
    return t4;
  }
  return t3;
};
function _temp(value) {
  return `selected--${value}`;
}
//# sourceMappingURL=index.js.map