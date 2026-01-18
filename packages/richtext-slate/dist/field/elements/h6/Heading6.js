'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { useElement } from '../../providers/ElementProvider.js';
export const Heading6Element = ()=>{
    const { attributes, children } = useElement();
    return /*#__PURE__*/ _jsx("h6", {
        ...attributes,
        children: children
    });
};

//# sourceMappingURL=Heading6.js.map