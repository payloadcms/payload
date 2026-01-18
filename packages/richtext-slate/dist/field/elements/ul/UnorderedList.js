'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { useElement } from '../../providers/ElementProvider.js';
import './index.scss';
export const UnorderedListElement = ()=>{
    const { attributes, children } = useElement();
    return /*#__PURE__*/ _jsx("ul", {
        className: "rich-text-ul",
        ...attributes,
        children: children
    });
};

//# sourceMappingURL=UnorderedList.js.map