'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { useElement } from '../../providers/ElementProvider.js';
export const Heading3Element = ()=>{
    const { attributes, children } = useElement();
    return /*#__PURE__*/ _jsx("h3", {
        ...attributes,
        children: children
    });
};

//# sourceMappingURL=Heading3.js.map