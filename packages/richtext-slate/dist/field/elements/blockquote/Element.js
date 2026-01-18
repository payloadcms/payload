'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { useElement } from '../../providers/ElementProvider.js';
import './index.scss';
export const BlockquoteElement = ()=>{
    const { attributes, children } = useElement();
    return /*#__PURE__*/ _jsx("blockquote", {
        className: "rich-text-blockquote",
        ...attributes,
        children: children
    });
};

//# sourceMappingURL=Element.js.map