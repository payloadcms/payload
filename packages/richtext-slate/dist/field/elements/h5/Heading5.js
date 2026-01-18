'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { useElement } from '../../providers/ElementProvider.js';
export const Heading5Element = ()=>{
    const { attributes, children } = useElement();
    return /*#__PURE__*/ _jsx("h5", {
        ...attributes,
        children: children
    });
};

//# sourceMappingURL=Heading5.js.map