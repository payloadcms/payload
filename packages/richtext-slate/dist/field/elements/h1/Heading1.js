'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { useElement } from '../../providers/ElementProvider.js';
export const Heading1Element = ()=>{
    const { attributes, children } = useElement();
    return /*#__PURE__*/ _jsx("h1", {
        ...attributes,
        children: children
    });
};

//# sourceMappingURL=Heading1.js.map