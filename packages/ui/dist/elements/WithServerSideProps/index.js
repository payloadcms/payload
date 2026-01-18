import { jsx as _jsx } from "react/jsx-runtime";
import { isReactServerComponentOrFunction } from 'payload/shared';
import React from 'react';
export const WithServerSideProps = ({
  Component,
  serverOnlyProps,
  ...rest
}) => {
  if (Component) {
    const WithServerSideProps = passedProps => {
      const propsWithServerOnlyProps = {
        ...passedProps,
        ...(isReactServerComponentOrFunction(Component) ? serverOnlyProps ?? {} : {})
      };
      return /*#__PURE__*/_jsx(Component, {
        ...propsWithServerOnlyProps
      });
    };
    return WithServerSideProps(rest);
  }
  return null;
};
//# sourceMappingURL=index.js.map