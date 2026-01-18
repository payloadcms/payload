'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { useLeaf } from '../../../providers/LeafProvider.js';
export const StrikethroughLeaf = ()=>{
    const { attributes, children } = useLeaf();
    return /*#__PURE__*/ _jsx("del", {
        ...attributes,
        children: children
    });
};

//# sourceMappingURL=index.js.map