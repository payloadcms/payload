'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { Fragment, useState } from 'react';
import { components } from 'react-select';
import { Tooltip } from '../../../../elements/Tooltip/index.js';
import { EditIcon } from '../../../../icons/Edit/index.js';
import { useAuth } from '../../../../providers/Auth/index.js';
import { useTranslation } from '../../../../providers/Translation/index.js';
import './index.scss';
const baseClass = 'relationship--multi-value-label';
export const MultiValueLabel = props => {
  const {
    data: t0,
    selectProps: t1
  } = props;
  const {
    allowEdit,
    label,
    relationTo,
    value
  } = t0;
  const {
    customProps: t2
  } = t1 === undefined ? {} : t1;
  const {
    draggableProps,
    onDocumentOpen
  } = t2 === undefined ? {} : t2;
  const {
    permissions
  } = useAuth();
  const [showTooltip, setShowTooltip] = useState(false);
  const {
    t
  } = useTranslation();
  const hasReadPermission = Boolean(permissions?.collections?.[relationTo]?.read);
  return _jsxs("div", {
    className: baseClass,
    title: label || "",
    children: [_jsx("div", {
      className: `${baseClass}__content`,
      children: _jsx(components.MultiValueLabel, {
        ...props,
        innerProps: {
          className: `${baseClass}__text`,
          ...(draggableProps || {})
        }
      })
    }), relationTo && hasReadPermission && allowEdit !== false && _jsx(Fragment, {
      children: _jsxs("button", {
        "aria-label": `Edit ${label}`,
        className: `${baseClass}__drawer-toggler`,
        onClick: event => {
          setShowTooltip(false);
          onDocumentOpen({
            id: value,
            collectionSlug: relationTo,
            hasReadPermission,
            openInNewTab: event.metaKey || event.ctrlKey
          });
        },
        onKeyDown: _temp,
        onMouseDown: _temp2,
        onMouseEnter: () => setShowTooltip(true),
        onMouseLeave: () => setShowTooltip(false),
        onTouchEnd: _temp3,
        type: "button",
        children: [_jsx(Tooltip, {
          className: `${baseClass}__tooltip`,
          show: showTooltip,
          children: t("general:editLabel", {
            label: ""
          })
        }), _jsx(EditIcon, {
          className: `${baseClass}__icon`
        })]
      })
    })]
  });
};
function _temp(e) {
  if (e.key === "Enter") {
    e.stopPropagation();
  }
}
function _temp2(e_0) {
  return e_0.stopPropagation();
}
function _temp3(e_1) {
  return e_1.stopPropagation();
}
//# sourceMappingURL=index.js.map