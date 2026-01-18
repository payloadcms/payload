'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { useElement } from '../../providers/ElementProvider.js';
export const IndentElement = ()=>{
    const { attributes, children } = useElement();
    return /*#__PURE__*/ _jsx("div", {
        style: {
            paddingLeft: 25
        },
        ...attributes,
        children: children
    });
};

//# sourceMappingURL=Element.js.map