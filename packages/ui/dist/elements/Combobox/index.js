'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useMemo, useRef, useState } from 'react';
import { Popup, PopupList } from '../Popup/index.js';
import './index.scss';
const baseClass = 'combobox';
/**
 * A wrapper on top of Popup + PopupList.ButtonGroup that adds search functionality.
 *
 * @internal - this component may be removed or receive breaking changes in minor releases.
 * @experimental
 */
export const Combobox = props => {
  const {
    entries,
    minEntriesForSearch = 8,
    onSelect,
    onToggleClose,
    onToggleOpen,
    searchPlaceholder = 'Search...',
    ...popupProps
  } = props;
  const [searchValue, setSearchValue] = useState('');
  const isOpenRef = useRef(false);
  const searchInputRef = useRef(null);
  const filteredEntries = useMemo(() => {
    if (!searchValue) {
      return entries;
    }
    const search = searchValue.toLowerCase();
    return entries.filter(entry => entry.name.toLowerCase().includes(search));
  }, [entries, searchValue]);
  const showSearch = entries.length >= minEntriesForSearch;
  const hasResults = filteredEntries.length > 0;
  const handleToggleOpen = React.useCallback(active => {
    isOpenRef.current = active;
    if (active && showSearch) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
    onToggleOpen?.(active);
  }, [showSearch, onToggleOpen]);
  const handleToggleClose = React.useCallback(() => {
    isOpenRef.current = false;
    setSearchValue('');
    onToggleClose?.();
  }, [onToggleClose]);
  return /*#__PURE__*/_jsx(Popup, {
    ...popupProps,
    className: `${baseClass} ${popupProps.className || ''}`,
    onToggleClose: handleToggleClose,
    onToggleOpen: handleToggleOpen,
    render: ({
      close
    }) => /*#__PURE__*/_jsxs("div", {
      className: `${baseClass}__content`,
      children: [showSearch && /*#__PURE__*/_jsx("div", {
        className: `${baseClass}__search-wrapper${!hasResults ? ` ${baseClass}__search-wrapper--no-results` : ''}`,
        children: /*#__PURE__*/_jsx("input", {
          "aria-label": searchPlaceholder,
          className: `${baseClass}__search-input`,
          onChange: e => setSearchValue(e.target.value),
          placeholder: searchPlaceholder,
          ref: searchInputRef,
          type: "text",
          value: searchValue
        })
      }), /*#__PURE__*/_jsx(PopupList.ButtonGroup, {
        children: filteredEntries.map((entry_0, index) => {
          const handleClick = () => {
            if (onSelect) {
              onSelect(entry_0);
            }
            close();
          };
          return /*#__PURE__*/_jsx("div", {
            className: `${baseClass}__entry`,
            onClick: handleClick,
            onKeyDown: e_0 => {
              if (e_0.key === 'Enter' || e_0.key === ' ') {
                e_0.preventDefault();
                handleClick();
              }
            },
            role: "menuitem",
            tabIndex: 0,
            children: entry_0.Component
          }, `${entry_0.name}-${index}`);
        })
      })]
    })
  });
};
//# sourceMappingURL=index.js.map