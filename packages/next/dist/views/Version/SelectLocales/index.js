'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import { AnimateHeight } from '@payloadcms/ui';
import { PillSelector } from '@payloadcms/ui';
import React from 'react';
const baseClass = 'select-version-locales';
export const SelectLocales = ({
  locales,
  localeSelectorOpen,
  onChange
}) => {
  return /*#__PURE__*/_jsx(AnimateHeight, {
    className: baseClass,
    height: localeSelectorOpen ? 'auto' : 0,
    id: `${baseClass}-locales`,
    children: /*#__PURE__*/_jsx(PillSelector, {
      onClick: ({
        pill
      }) => {
        const newLocales = locales.map(locale => {
          if (locale.name === pill.name) {
            return {
              ...locale,
              selected: !pill.selected
            };
          } else {
            return locale;
          }
        });
        onChange({
          locales: newLocales
        });
      },
      pills: locales
    })
  });
};
//# sourceMappingURL=index.js.map