import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React from 'react';
import { ChevronIcon } from '../../../icons/Chevron/index.js';
import { SortDownIcon, SortUpIcon } from '../../../icons/Sort/index.js';
import { useFolder } from '../../../providers/Folders/index.js';
import { useTranslation } from '../../../providers/Translation/index.js';
import { Pill } from '../../Pill/index.js';
import { Popup, PopupList } from '../../Popup/index.js';
import './index.scss';
const baseClass = 'sort-by-pill';
const sortOnOptions = [{
  label: t => t('general:name'),
  value: 'name'
}, {
  label: t => t('general:createdAt'),
  value: 'createdAt'
}, {
  label: t => t('general:updatedAt'),
  value: 'updatedAt'
}];
const orderOnOptions = [{
  label: t => /*#__PURE__*/_jsxs(_Fragment, {
    children: [/*#__PURE__*/_jsx(SortUpIcon, {}), t('general:ascending')]
  }),
  value: 'asc'
}, {
  label: t => /*#__PURE__*/_jsxs(_Fragment, {
    children: [/*#__PURE__*/_jsx(SortDownIcon, {}), t('general:descending')]
  }),
  value: 'desc'
}];
export function SortByPill() {
  const {
    refineFolderData,
    sort
  } = useFolder();
  const {
    t
  } = useTranslation();
  const sortDirection = sort.startsWith('-') ? 'desc' : 'asc';
  const [selectedSortOption] = sortOnOptions.filter(({
    value
  }) => value === (sort.startsWith('-') ? sort.slice(1) : sort)) || sortOnOptions;
  const [selectedOrderOption] = orderOnOptions.filter(({
    value
  }) => value === sortDirection);
  return /*#__PURE__*/_jsx(Popup, {
    button: /*#__PURE__*/_jsxs(Pill, {
      className: `${baseClass}__trigger`,
      icon: /*#__PURE__*/_jsx(ChevronIcon, {}),
      size: "small",
      children: [sortDirection === 'asc' ? /*#__PURE__*/_jsx(SortUpIcon, {
        className: `${baseClass}__sort-icon`
      }) : /*#__PURE__*/_jsx(SortDownIcon, {
        className: `${baseClass}__sort-icon`
      }), selectedSortOption?.label(t)]
    }),
    className: baseClass,
    horizontalAlign: "right",
    render: ({
      close
    }) => /*#__PURE__*/_jsxs(_Fragment, {
      children: [/*#__PURE__*/_jsx(PopupList.GroupLabel, {
        label: "Sort by"
      }), /*#__PURE__*/_jsx(PopupList.ButtonGroup, {
        children: sortOnOptions.map(({
          label,
          value
        }) => /*#__PURE__*/_jsx(PopupList.Button, {
          active: selectedSortOption?.value === value,
          onClick: () => {
            refineFolderData({
              query: {
                page: '1',
                sort: sortDirection === 'desc' ? `-${value}` : value
              },
              updateURL: true
            });
            close();
          },
          children: label(t)
        }, value))
      }), /*#__PURE__*/_jsx(PopupList.Divider, {}), /*#__PURE__*/_jsx(PopupList.GroupLabel, {
        label: "Order"
      }), /*#__PURE__*/_jsx(PopupList.ButtonGroup, {
        children: orderOnOptions.map(({
          label,
          value
        }) => /*#__PURE__*/_jsx(PopupList.Button, {
          active: selectedOrderOption?.value === value,
          className: `${baseClass}__order-option`,
          onClick: () => {
            if (sortDirection !== value) {
              refineFolderData({
                query: {
                  page: '1',
                  sort: value === 'desc' ? `-${selectedSortOption?.value}` : selectedSortOption?.value
                },
                updateURL: true
              });
              close();
            }
          },
          children: label(t)
        }, value))
      })]
    }),
    showScrollbar: true,
    verticalAlign: "bottom"
  });
}
//# sourceMappingURL=index.js.map