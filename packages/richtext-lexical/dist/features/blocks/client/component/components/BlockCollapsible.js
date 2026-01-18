'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { useBlockComponentContext } from '../BlockContent.js';
export const BlockCollapsible = props => {
  const {
    children,
    ...rest
  } = props;
  const {
    BlockCollapsible
  } = useBlockComponentContext();
  return BlockCollapsible ? _jsx(BlockCollapsible, {
    ...rest,
    children
  }) : null;
};
//# sourceMappingURL=BlockCollapsible.js.map