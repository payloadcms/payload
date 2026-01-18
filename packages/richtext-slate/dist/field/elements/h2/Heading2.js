'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { useElement } from '../../providers/ElementProvider.js';
export const Heading2Element = ()=>{
    const { attributes, children } = useElement();
    return /*#__PURE__*/ _jsx("h2", {
        ...attributes,
        children: children
    });
};

//# sourceMappingURL=Heading2.js.map