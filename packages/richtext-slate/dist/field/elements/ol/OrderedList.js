'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { useElement } from '../../providers/ElementProvider.js';
import './index.scss';
export const OrderedListElement = ()=>{
    const { attributes, children } = useElement();
    return /*#__PURE__*/ _jsx("ol", {
        className: "rich-text-ol",
        ...attributes,
        children: children
    });
};

//# sourceMappingURL=OrderedList.js.map