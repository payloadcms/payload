'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { fieldBaseClass, ReactSelect, useTranslation } from '@payloadcms/ui';
import React, { memo, useCallback, useMemo } from 'react';
import { useVersionDrawer } from './VersionDrawer/index.js';
const baseClass = 'compare-version';
export const SelectComparison = /*#__PURE__*/memo(props => {
  const {
    collectionSlug,
    docID,
    globalSlug,
    onChange: onChangeFromProps,
    versionFromID,
    versionFromOptions
  } = props;
  const {
    t
  } = useTranslation();
  const {
    Drawer,
    openDrawer
  } = useVersionDrawer({
    collectionSlug,
    docID,
    globalSlug
  });
  const options = useMemo(() => {
    return [...versionFromOptions, {
      label: /*#__PURE__*/_jsx("span", {
        className: `${baseClass}-moreVersions`,
        children: t('version:moreVersions')
      }),
      value: 'more'
    }];
  }, [t, versionFromOptions]);
  const currentOption = useMemo(() => versionFromOptions.find(option => option.value === versionFromID), [versionFromOptions, versionFromID]);
  const onChange = useCallback(val => {
    if (val.value === 'more') {
      openDrawer();
      return;
    }
    onChangeFromProps(val);
  }, [onChangeFromProps, openDrawer]);
  return /*#__PURE__*/_jsxs("div", {
    className: [fieldBaseClass, baseClass].filter(Boolean).join(' '),
    children: [/*#__PURE__*/_jsx(ReactSelect, {
      isClearable: false,
      isSearchable: false,
      onChange: onChange,
      options: options,
      placeholder: t('version:selectVersionToCompare'),
      value: currentOption
    }), /*#__PURE__*/_jsx(Drawer, {})]
  });
});
//# sourceMappingURL=index.js.map