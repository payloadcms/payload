'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { components as SelectComponents } from 'react-select';
export const Control = props => {
  const {
    children,
    innerProps,
    // @ts-expect-error-next-line // TODO Fix this - moduleResolution 16 breaks our declare module
    selectProps: {
      customProps: {
        disableKeyDown,
        disableMouseDown
      } = {}
    } = {}
  } = props;
  return /*#__PURE__*/_jsx(React.Fragment, {
    children: /*#__PURE__*/_jsx(SelectComponents.Control, {
      ...props,
      innerProps: {
        ...innerProps,
        onKeyDown: e => {
          if (disableKeyDown) {
            e.stopPropagation();
            // Create event for keydown listeners which specifically want to bypass this stopPropagation
            const bypassEvent = new CustomEvent('bypassKeyDown', {
              detail: e
            });
            document.dispatchEvent(bypassEvent);
          }
        },
        // react-select has this typed incorrectly so we disable the linting rule
        // we need to prevent react-select from hijacking the 'onKeyDown' event while modals are open (i.e. the 'Relationship' field component)
        onMouseDown: e => {
          // we need to prevent react-select from hijacking the 'onMouseDown' event while modals are open (i.e. the 'Relationship' field component)
          if (!disableMouseDown) {
            innerProps.onMouseDown(e);
          }
        }
      },
      children: children
    })
  });
};
//# sourceMappingURL=index.js.map